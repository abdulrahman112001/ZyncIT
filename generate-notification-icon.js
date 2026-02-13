#!/usr/bin/env node
/**
 * Notification Icon Generator for Android
 * Creates ic_notification.png (white silhouette on transparent) for all densities.
 * Android notification icons must be single-color white (#FFFFFF) on transparent.
 *
 * Usage:
 *   cd "d:\my work\Dev\ZyncIT"
 *   node generate-notification-icon.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SVG_PATH = path.join(__dirname, "app", "src", "assets", "logo.svg");
const ANDROID_RES_DIR = path.join(
  __dirname,
  "app",
  "android",
  "app",
  "src",
  "main",
  "res",
);

// Android notification icon sizes by density
const NOTIFICATION_ICONS = [
  { folder: "drawable-mdpi", size: 24 },
  { folder: "drawable-hdpi", size: 36 },
  { folder: "drawable-xhdpi", size: 48 },
  { folder: "drawable-xxhdpi", size: 72 },
  { folder: "drawable-xxxhdpi", size: 96 },
];

async function generateNotificationIcons() {
  console.log("Generating Android notification icons (white silhouette)...\n");

  if (!fs.existsSync(SVG_PATH)) {
    console.error("ERROR: logo.svg not found at:", SVG_PATH);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const icon of NOTIFICATION_ICONS) {
    const outDir = path.join(ANDROID_RES_DIR, icon.folder);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, "ic_notification.png");

    try {
      // 1. Render SVG to a larger size for quality, then resize
      const rendered = await sharp(svgBuffer)
        .resize(icon.size, icon.size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      // 2. Extract alpha channel and use it as white pixels
      // Android notification icons: white (#FFF) where content is, transparent elsewhere
      const { data, info } = await sharp(rendered)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = Buffer.alloc(info.width * info.height * 4);
      for (let i = 0; i < info.width * info.height; i++) {
        const alpha = data[i * 4 + 3]; // Original alpha
        if (alpha > 20) {
          // White pixel with original alpha
          pixels[i * 4 + 0] = 255; // R
          pixels[i * 4 + 1] = 255; // G
          pixels[i * 4 + 2] = 255; // B
          pixels[i * 4 + 3] = alpha; // A
        } else {
          // Fully transparent
          pixels[i * 4 + 0] = 0;
          pixels[i * 4 + 1] = 0;
          pixels[i * 4 + 2] = 0;
          pixels[i * 4 + 3] = 0;
        }
      }

      await sharp(pixels, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toFile(outPath);

      console.log(
        `  ✓ ${icon.folder}/ic_notification.png (${icon.size}x${icon.size})`,
      );
    } catch (err) {
      console.error(`  ✗ ${icon.folder}: ${err.message}`);
    }
  }

  console.log("\nDone! Notification icons generated.");
}

generateNotificationIcons();
