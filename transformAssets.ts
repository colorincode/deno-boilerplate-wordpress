import { walkSync } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join, relative, extname, dirname, basename } from "https://deno.land/std@0.224.0/path/mod.ts";
import "./utils/processVideo_utils.ts"
import { transformVideos } from './utils/processVideo_utils.ts'
import sharp from "npm:sharp";
import { timings } from './utils/timingTracker.ts';


const CACHE_FILE = ".assetcache.json";
const imgExts = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".svg", ".gif"];
const videoExts = [".mp4", ".mov", ".webm", ".mkv"];

// utility to check if a path is an image
function isImage(path: string): boolean {
  return imgExts.includes(extname(path).toLowerCase());
}
// utility to check if a path is a video
function isVideo(path: string): boolean {
  return videoExts.includes(extname(path).toLowerCase());
}

async function copyFile(src: string, dest: string) {
  const destDir = dirname(dest);
  await Deno.mkdir(destDir, { recursive: true });
  await Deno.copyFile(src, dest);
}

async function optimizeImage(inputPath: string, outputPath: string) {
  const ext = extname(inputPath).toLowerCase();
  let image = sharp(inputPath);

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      image = image.jpeg({ quality: 80 });
      break;
    case ".png":
      image = image.png({ compressionLevel: 9 });
      break;
    case ".webp":
      image = image.webp({ quality: 80 });
      break;
    case ".avif":
      image = image.avif({ quality: 80 });
      break;
    case ".gif":
      return;
    default:
      return;
  }
  const outputDir = dirname(outputPath);
  await Deno.mkdir(outputDir, { recursive: true });
  const tempFilePath = join(outputDir, `${basename(outputPath, ext)}.tmp${ext}`);
  try {
    await image.toFile(tempFilePath);
    await Deno.remove(outputPath).catch(() => {});
    await Deno.rename(tempFilePath, outputPath);
  } catch (error) {
    console.error(`Error optimizing ${inputPath}: ${error}`);
  }
}

async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processFn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processFn));
  }
}

async function processFileEvent(srcPath: string, destBase: string) {
  const relPath = relative("./assets", srcPath);
  const destPath = join(destBase, relPath);

  await copyFile(srcPath, destPath);
  if (isImage(srcPath)) {
    await optimizeImage(srcPath, destPath);
  }
}

function debounce(fn: (...args: any[]) => void, delay: number) {
  let timeout: number | null = null;
  return (...args: any[]) => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}


// new asset caching and hashing
interface AssetCacheEntry {
  srcHash: string;  // original asset
  distHash: string; // built asset
}

async function hashFile(path: string, algo: "SHA-1" | "SHA-256" = "SHA-1"): Promise<string> {
  const data = await Deno.readFile(path);
  const hashBuffer = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function loadCache(): Promise<Record<string, AssetCacheEntry>> {
  try {
    const json = await Deno.readTextFile(CACHE_FILE);
    return JSON.parse(json);
  } catch {
    return {}; // no cache yet
  }
}

async function saveCache(cache: Record<string, AssetCacheEntry>) {
  await Deno.writeTextFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}
async function processAssetWithCache(
  relPath: string,
  srcPath: string,
  destPath: string,
  cache: Record<string, AssetCacheEntry>
): Promise<"processed" | "removed" | "skipped"> {
  try {
    await Deno.stat(srcPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      try {
        await Deno.remove(destPath);
      } catch (_) {
        // ignore if file doesn't exist
      }
      delete cache[relPath];
      return "removed";
    }
    throw error;
  }

  const srcHash = await hashFile(srcPath);
  const cached = cache[relPath];
  let distHash = "";

  if (cached?.srcHash === srcHash) {
    try {
      distHash = await hashFile(destPath);
      if (distHash === cached.distHash) return "skipped";
    } catch { /* ignore */ }
  } else {
    // skip dist hash check
  }

  await copyFile(srcPath, destPath);
  if (isImage(srcPath)) {
    await optimizeImage(srcPath, destPath);
  }
  distHash = await hashFile(destPath);
  cache[relPath] = { srcHash, distHash };
  return "processed";
}


async function cleanStaleFiles(srcDir: string, destDir: string, cache: Record<string, AssetCacheEntry>) {
  for (const relPath of Object.keys(cache)) {
    const srcPath = join(srcDir, relPath);
    const destPath = join(destDir, relPath);
    try {
      await Deno.stat(srcPath); // check if source file exists
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        await Deno.remove(destPath).catch(() => {});
        delete cache[relPath];
      } else {
        console.error(`Error checking file ${srcPath}:`, error);
      }
    }
  }
}

export async function transformAssets(changedFiles: Set<string> | null = null, isProd: boolean = false) {
  const start = performance.now();
  const srcDir = "./assets";
  const destDir = isProd ? "./prod/assets" : "./dist/assets";
  const cache = await loadCache();
  const batchSize = 10;

  const videosToProcess: string[] = [];

  if (changedFiles && changedFiles.size > 0) {
    const files = Array.from(changedFiles);

    await processInBatches(files, batchSize, async (file) => {
      const relPath = relative(srcDir, file);
      const destPath = join(destDir, relPath);
      const status = await processAssetWithCache(relPath, file, destPath, cache);

      if (status === "processed") {
        console.log(`${relPath} processed`);
      } else if (status === "removed") {
        console.log(`${relPath} removed`);
      } // skip logging
    });
  } else {
    const files = Array.from(walkSync(srcDir))
      .filter((entry) => entry.isFile)
      .map((entry) => ({ path: entry.path, relPath: relative(srcDir, entry.path) }));

    await processInBatches(files, batchSize, async ({ path, relPath }) => {
      const destPath = join(destDir, relPath);
      await processAssetWithCache(relPath, path, destPath, cache);
    });
  }

  await transformVideos(changedFiles, { isProd });
  await cleanStaleFiles(srcDir, destDir, cache);
  await saveCache(cache);

  const end = performance.now();
  timings.assets = Math.round(end - start);
}