import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join, relative } from "https://deno.land/std@0.224.0/path/mod.ts";

const srcPath = "./src";
const distPath = "./dist";
const WPHeader = `/*
 * Plugin Name:       Trinket and Thrift
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Trinket and Thrift custom plugin.
 * Version:           0.0.1
 * Requires at least: 7.3
 * Requires PHP:      8.2
 * Author:            Color In Code
 * Author URI:        https://colorincode.me/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Update URI:        https://trinketandthrift.com/my-plugin/
 * Text Domain:       trinket-and-thrift
 * Domain Path:       /
 * Requires Plugins:  gp-premium
 */`;
/**
 * Collects all PHP files, removes closing tags, concatenates them,
 * and generates wp_enqueue_script() entries for each PHP file.
 */
export async function transformPHP() {
  const phpFiles: string[] = [];

  // Gather all .php files from src
  for await (const entry of walk(srcPath, { includeFiles: true, exts: [".php"] })) {
    phpFiles.push(entry.path);
  }

  let output = `${WPHeader}\n\n<?php\n\n`;

  // Build functions.php with combined PHP
  for (const filePath of phpFiles) {
    let content = await Deno.readTextFile(filePath);

    // Remove <?php
    content = content.replace(/<\?php\s*/g, "");
    // Remove ?>
    content = content.replace(/\?>/g, "").trim();

    const rel = relative(srcPath, filePath);

    output += `/**\n * Source: ${rel}\n */\n`;
    output += content + "\n\n";
  }

  // Add enqueue section
  output += "/* -------------------------------------------- */\n";
  output += "/* Auto-Generated PHP Script Enqueues           */\n";
  output += "/* -------------------------------------------- */\n\n";

  output += "add_action('wp_enqueue_scripts', function() {\n";

  for (const filePath of phpFiles) {
    const rel = relative(srcPath, filePath);

    // Convert file path into a script handle
    const handle = rel
      .replace(/\.php$/, "")
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Use the PHP file path as the $src parameter
    output += `    wp_enqueue_script('${handle}', '${rel}', [], null, true);\n`;
  }

  output += "});\n";

  // Output to dist/functions.php
  const functionsPath = join(distPath, "functions.php");
  await Deno.writeTextFile(functionsPath, output);
}
