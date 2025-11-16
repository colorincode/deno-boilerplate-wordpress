import sharp from "npm:sharp";
import { extname, dirname, basename, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const imgExts = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".svg", ".gif"];

export function isImage(path: string): boolean {
  return imgExts.includes(extname(path).toLowerCase());
}

export async function optimizeImage(inputPath: string, outputPath: string) {
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

export async function transformImages(paths: string[]) {
  for (const path of paths) {
    await optimizeImage(path, path);
  }
}
