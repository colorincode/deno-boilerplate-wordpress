// deno-lint-ignore-file no-unused-vars
import { ensureDir, walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { dirname, join, relative , resolve} from "https://deno.land/std@0.224.0/path/mod.ts";
import { Application, send } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { transformAssets } from "./transformAssets.ts";
import { transformTS } from "./transformJS.ts";
import { transformSCSS } from "./transformSCSS.ts";
import { route, type Route } from "@std/http/unstable-route";
import { open } from "https://deno.land/x/open@v1.0.0/index.ts";
import * as path from 'npm:path';
import posthtml from "npm:posthtml";
import include from "npm:posthtml-include";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { acceptWebSocket, isWebSocketCloseEvent } from "https://deno.land/std@0.65.0/ws/mod.ts?s=WebSocketEvent";
import { debounce } from "https://deno.land/std@0.224.0/async/debounce.ts";
import { encoder } from 'https://deno.land/std@0.65.0/encoding/utf8.ts';
import { startDinoAnimation } from "./utils/dino.ts";
import { runBenches } from './utils/performance-test.ts';
import { transformHTML } from "./transformHTML.ts";
import { timings, BuildTimings } from './utils/timingTracker.ts';

// const { stopAnimation, updateStatus } = startDinoAnimation(false);
let currentWatcher: Deno.FsWatcher | null = null;
//defs
interface Server {
  finished: Promise<void>;
  shutdown(): Promise<void>;  // changed from close() to shutdown()
  addr: Deno.NetAddr;     
}
//globals
const port = 1234;
const srcPath = "./src";
const distPath = "./dist";

//state
const wss = new Set<WebSocket>();
let server: Server | null = null;
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (true) {
    try {
      const listener = Deno.listen({ port });
      await listener.close();
      return port; //moved return here instead of lower
    } catch (error) {
      if (error instanceof Deno.errors.AddrInUse) {
        port++;
        continue; //added continue
    
      } else {
        throw error;
      }
    }
  }
}

function cleanupSocket(socket: WebSocket) {
  if (wss.has(socket)) {
    wss.delete(socket);
    console.log("WebSocket disconnected");
  }
}

async function mirrorDirectoryStructure(sourcePath: string, targetPath: string): Promise<void>  {
  const start = performance.now();
  await Deno.mkdir("./assets").catch(() => {});
  try {
    // lets check if dir is there. 
    await Deno.mkdir(targetPath, { recursive: true });

    for await (const entry of Deno.readDir(sourcePath)) {
      //just cleaned up syntax, shouldnt change func
      if (entry.isDirectory) {
        const newDirName = targetPath.startsWith("./dist")
          ? entry.name === "scss" ? "css" 
          : entry.name === "ts" ? "js" 
          : entry.name
          : entry.name;
          await mirrorDirectoryStructure(
            `${sourcePath}/${entry.name}`,
            `${targetPath}/${newDirName}`
          );
      }
    }
  } catch (error) {
    console.error(`Error processing ${sourcePath}:`, error);
  }
}

async function build(changedFiles: Set<string> | null = null) {
  const start = performance.now();
  Object.keys(timings).forEach(key => delete (timings as any)[key]);

  await mirrorDirectoryStructure(srcPath, distPath);

  try {
    const changed = changedFiles
      ? [...changedFiles].map(p => p.toLowerCase())
      : null;

    const tasks: Promise<void>[] = [];

    if (!changed || changed.some(p => p.endsWith(".html") || p.endsWith(".htm"))) {
      tasks.push(transformHTML(changedFiles));
    }

    if (!changed || changed.some(p => p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".js"))) {
      tasks.push(transformTS(changedFiles));
    }

    if (!changed || changed.some(p => p.endsWith(".scss") || p.endsWith(".sass") || p.endsWith(".css"))) {
      tasks.push(transformSCSS(changedFiles));
    }

    if (!changed || changed.some(p => /\.(png|jpe?g|svg|gif|webp|mp4|woff2?|ttf|ico|json|txt)$/.test(p))) {
      tasks.push(transformAssets(changedFiles));
    }

    await Promise.all(tasks);

  } catch (error) {
    console.error("❌ error during dist build process:", error);
  } finally {
    const end = performance.now();
    timings.total = Math.round(end - start);

    const colorizeValue = (value: number | undefined): string => {
      if (value === undefined) return '-';
      const roundedValue = Math.round(value);
      if (value < 5000) return `\x1B[32m${roundedValue}ms\x1B[0m`; // < 2s = green
      if (value <= 10000) return `\x1B[38;5;208m${roundedValue}ms\x1B[0m`; // 5-10s = orange
      return `\x1B[31m${roundedValue}ms\x1B[0m`; // > 10s = red
    };

    console.log(
      `\x1B[38;5;172mhtml\x1B[0m = ${colorizeValue(timings.html)} | ` +
      `\x1B[38;5;68mts\x1B[0m = ${colorizeValue(timings.ts)} | ` +
      `\x1B[38;5;218mscss\x1B[0m = ${colorizeValue(timings.scss)} | ` +
      `\x1B[95massets\x1B[0m = ${colorizeValue(timings.assets)} | ` +
      `total = ${colorizeValue(timings.total)}`
    );
  }
}





const debouncedBuild = debounce(async (changedFiles: Set<string>) => {
  // console.log("Debounced build triggered with changes:", Array.from(changedFiles));
  await build(changedFiles);
  wss.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      setTimeout(() => ws.send("reload"), 100); // buffer so reload wont happen too quickly
    }
  });
}, 300);


async function createServer() : Promise<void> {
  if (server) {
    await server.shutdown(); 
    await server.finished;
  }
 const availablePort = await findAvailablePort(port);
//  server = Deno.serve({ port: availablePort }, async (req) => {
    server = Deno.serve({
      port: availablePort,
      onListen: ({ hostname, port }) => {
        // console.log(`Dinos have landed. http://${hostname}:${port}`);
      },
    }, async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const pathname = url.pathname;
  
    if (pathname === "/ws") {
      if (req.headers.get("upgrade") !== "websocket") {
        return new Response("Expected websocket", { status: 400 });
      }
      
      const { socket, response } = Deno.upgradeWebSocket(req);
      socket.onopen = () => {
        (socket as any).id = crypto.randomUUID();
        wss.add(socket);
        console.log(`WebSocket #${(socket as any).id} connected`);
        console.log(`Total WebSockets: ${wss.size}`);
      };
      socket.onclose = (event) => {
        console.log(`Socket closed: code=${event.code}, reason=${event.reason}`);
        cleanupSocket(socket);
      };
      socket.onerror = (error) => {
        console.error(`Error on WebSocket #${socket.id}`, error);
        cleanupSocket(socket);
      };
      return response;
    }
  
    try {
      return await serveDir(req, {
        fsRoot: distPath,
        showDirListing: false,
        quiet: true,
      });
    } catch (error) {
      console.error(`Error serving ${pathname}:`, error);
      return new Response("Not Found", { status: 404 });
    }
  });
  setTimeout(() => {
    console.log(`Dinos have landed.🌴🦕 \x1B[92mhttp://localhost:${availablePort}\x1B[0m`);
  }, 50);
  setTimeout(() => {
  const { stopAnimation } = startDinoAnimation();
  }, 100);
}

async function startWatching() {
  if (currentWatcher) {
    try {
      currentWatcher.close();
    } catch (e) {
      console.error("Error closing watcher:", e);
    }
  }

  currentWatcher = Deno.watchFs(["src", "utils", "assets"], { recursive: true });
  console.log("Watching src, utils, assets...");
  const pendingChanges = new Set<string>();

  for await (const event of currentWatcher) {
    event.paths.forEach(path => {
      const resolvedPath = resolve(path);
      // console.log(`Adding path to pendingChanges: ${resolvedPath}`);
      pendingChanges.add(resolvedPath);
    });

    // console.log("Pending changes before debounce:", Array.from(pendingChanges));
    // Pass a copy of pendingChanges to debouncedBuild
    const changesToProcess = new Set(pendingChanges);
    debouncedBuild(changesToProcess);
    pendingChanges.clear();
    // Do not clear pendingChanges here; let it accumulate
  }
}

// graceful shutdown
addEventListener("SIGINT", async () => {
  console.log("\nShutting down...");
  currentWatcher?.close();
  wss.forEach(ws => ws.close(1001, "Server shutting down"));
  Deno.exit();
});

async function main(): Promise<void> {
  await build();
  await createServer();
  await startWatching();
}

main().catch(console.error);