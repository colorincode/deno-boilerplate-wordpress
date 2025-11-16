import { emptyDir } from "https://deno.land/std@0.224.0/fs/mod.ts";


export async function clear() {
    await emptyDir("./dist");
    await emptyDir("./prod");
    await Deno.remove(".assetcache.json").catch(() => {});
    console.log("Cleared dist, prod directories, and .assetcache.json file.");
}
clear();