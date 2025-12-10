import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PUBLIC_IMAGES_DIR = path.resolve("./public/images");
const THUMBNAIL_WIDTH = 800; // Max width for thumbnails
const GIF_FPS = 10; // Frames per second for GIF
const GIF_DURATION = 3; // Seconds of video to convert to GIF
const JPEG_QUALITY = 80; // JPEG quality (1-100)

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm"]);

/**
 * Generate a thumbnail for an image using sips (macOS) or ImageMagick
 */
async function generateImageThumbnail(inputPath, outputPath) {
  try {
    // Use sips on macOS for better quality and speed
    await execFileAsync("sips", [
      "-Z",
      THUMBNAIL_WIDTH.toString(),
      "--setProperty",
      "format",
      "jpeg",
      "--setProperty",
      "formatOptions",
      JPEG_QUALITY.toString(),
      inputPath,
      "--out",
      outputPath,
    ]);
    return true;
  } catch (err) {
    console.warn(
      `  ⚠️  Failed to generate thumbnail for ${inputPath}:`,
      err.message,
    );
    return false;
  }
}

/**
 * Generate a GIF thumbnail from a video using ffmpeg
 */
async function generateVideoThumbnail(inputPath, outputPath) {
  try {
    // Generate a compact, optimized GIF from the first few seconds
    await execFileAsync("ffmpeg", [
      "-i",
      inputPath,
      "-t",
      GIF_DURATION.toString(),
      "-vf",
      `fps=${GIF_FPS},scale=${THUMBNAIL_WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`,
      "-loop",
      "0",
      "-y",
      outputPath,
    ]);
    return true;
  } catch (err) {
    console.warn(`  ⚠️  Failed to generate GIF for ${inputPath}:`, err.message);
    return false;
  }
}

/**
 * Walk through all project directories and generate thumbnails
 */
async function processDirectory(dirPath, stats = null) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath, stats);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const baseName = path.basename(entry.name, ext);
      const dirName = path.dirname(fullPath);

      // Skip if already a thumbnail
      if (baseName.endsWith("_thumb")) {
        continue;
      }

      if (IMAGE_EXTENSIONS.has(ext)) {
        const thumbnailPath = path.join(dirName, `${baseName}_thumb.jpg`);

        // Skip if thumbnail already exists
        if (fs.existsSync(thumbnailPath)) {
          if (stats) stats.skipped++;
          continue;
        }

        const success = await generateImageThumbnail(fullPath, thumbnailPath);
        if (success && stats) {
          stats.created++;
        } else if (!success && stats) {
          stats.failed++;
        }
      } else if (VIDEO_EXTENSIONS.has(ext)) {
        const thumbnailPath = path.join(dirName, `${baseName}_thumb.gif`);

        // Skip if thumbnail already exists
        if (fs.existsSync(thumbnailPath)) {
          if (stats) stats.skipped++;
          continue;
        }

        const success = await generateVideoThumbnail(fullPath, thumbnailPath);
        if (success && stats) {
          stats.created++;
        } else if (!success && stats) {
          stats.failed++;
        }
      }
    }

    // Update progress if stats provided
    if (stats) {
      const total = stats.skipped + stats.created + stats.failed;
      const percentage = Math.round((total / stats.total) * 100);
      const filled = Math.round((25 * total) / stats.total);
      const empty = 25 - filled;
      const bar = "█".repeat(filled) + "░".repeat(empty);
      process.stdout.write(
        `\r[${bar}] ${percentage}% (${total}/${stats.total})`,
      );
    }
  }
}

/**
 * Count total files to process
 */
function countFilesToProcess(dirPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      count += countFilesToProcess(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const baseName = path.basename(entry.name, ext);

      // Count if it's an image or video and not already a thumbnail
      if (
        !baseName.endsWith("_thumb") &&
        (IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext))
      ) {
        count++;
      }
    }
  }

  return count;
}

async function main() {
  console.log("🚀 Starting thumbnail generation...");

  if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
    console.error(`❌ Directory not found: ${PUBLIC_IMAGES_DIR}`);
    process.exit(1);
  }

  try {
    const totalFiles = countFilesToProcess(PUBLIC_IMAGES_DIR);
    const stats = {
      total: totalFiles,
      created: 0,
      skipped: 0,
      failed: 0,
    };

    await processDirectory(PUBLIC_IMAGES_DIR, stats);

    console.log(
      `\n✅ Thumbnail generation complete! (${stats.created} created, ${stats.skipped} skipped)`,
    );
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main().catch(console.error);
