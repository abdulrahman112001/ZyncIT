#!/usr/bin/env node
/**
 * Icon Generator Script for iRopit/ZyncIT
 * Converts logo.svg to all required PNG sizes for Android, iOS, and Chrome Extension
 *
 * Usage:
 *   cd "d:\my work\Dev\ZyncIT"
 *   npm install sharp --save-dev   (if not installed)
 *   node generate-icons.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SVG_PATH = path.join(__dirname, "app", "src", "assets", "logo.svg");

// --- Output definitions ---

const ANDROID_ICONS = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
];

const ANDROID_RES_DIR = path.join(
  __dirname,
  "app",
  "android",
  "app",
  "src",
  "main",
  "res",
);

const IOS_ICONS = [
  { filename: "icon-20@2x.png", size: 40 },
  { filename: "icon-20@3x.png", size: 60 },
  { filename: "icon-29@2x.png", size: 58 },
  { filename: "icon-29@3x.png", size: 87 },
  { filename: "icon-40@2x.png", size: 80 },
  { filename: "icon-40@3x.png", size: 120 },
  { filename: "icon-60@2x.png", size: 120 },
  { filename: "icon-60@3x.png", size: 180 },
  { filename: "icon-1024.png", size: 1024 },
];

const IOS_APPICONSET_DIR = path.join(
  __dirname,
  "app",
  "ios",
  "ZyncIT",
  "Images.xcassets",
  "AppIcon.appiconset",
);

const CHROME_ICONS = [
  { filename: "icon16.png", size: 16 },
  { filename: "icon32.png", size: 32 },
  { filename: "icon48.png", size: 48 },
  { filename: "icon128.png", size: 128 },
];

const CHROME_ASSETS_DIR = path.join(__dirname, "chrome-extension", "assets");

// Additional: onboarding logo for React Native app
const APP_ASSETS = [
  { filename: "logo.png", size: 512 },
  { filename: "logo@2x.png", size: 1024 },
  { filename: "logo@3x.png", size: 1536 },
];

const APP_ASSETS_DIR = path.join(__dirname, "app", "src", "assets");

// Adaptive icon foreground for Android (with padding)
const ANDROID_ADAPTIVE_ICONS = [
  { folder: "mipmap-mdpi", size: 108 },
  { folder: "mipmap-hdpi", size: 162 },
  { folder: "mipmap-xhdpi", size: 216 },
  { folder: "mipmap-xxhdpi", size: 324 },
  { folder: "mipmap-xxxhdpi", size: 432 },
];

async function generateIcon(svgBuffer, outputPath, size, round = false) {
  let pipeline = sharp(svgBuffer, { density: 300 }).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (round) {
    // Create circular mask
    const circle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
    );
    const mask = await sharp(circle).resize(size, size).png().toBuffer();

    const base = await pipeline.png().toBuffer();
    pipeline = sharp(base).composite([{ input: mask, blend: "dest-in" }]);
  }

  await pipeline.png().toFile(outputPath);
  console.log(`  ✅ ${path.basename(outputPath)} (${size}x${size})`);
}

async function main() {
  console.log("🎨 iRopit Icon Generator");
  console.log("========================\n");

  if (!fs.existsSync(SVG_PATH)) {
    console.error(`❌ SVG not found: ${SVG_PATH}`);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);
  console.log(`📂 Source SVG: ${SVG_PATH}\n`);

  // 1. Android Icons
  console.log("📱 Generating Android icons...");
  for (const { folder, size } of ANDROID_ICONS) {
    const dir = path.join(ANDROID_RES_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });

    // Standard icon
    await generateIcon(svgBuffer, path.join(dir, "ic_launcher.png"), size);
    // Round icon
    await generateIcon(
      svgBuffer,
      path.join(dir, "ic_launcher_round.png"),
      size,
      true,
    );
  }

  // Android adaptive icon foreground
  console.log("\n📱 Generating Android adaptive icon foreground...");
  for (const { folder, size } of ANDROID_ADAPTIVE_ICONS) {
    const dir = path.join(ANDROID_RES_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });

    // Foreground with padding (icon in center 66% of the canvas)
    const iconSize = Math.round(size * 0.66);
    const padding = Math.round((size - iconSize) / 2);

    const resized = await sharp(svgBuffer, { density: 300 })
      .resize(iconSize, iconSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resized, left: padding, top: padding }])
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"));

    console.log(`  ✅ ic_launcher_foreground.png (${size}x${size})`);
  }

  // 2. iOS Icons
  console.log("\n🍎 Generating iOS icons...");
  fs.mkdirSync(IOS_APPICONSET_DIR, { recursive: true });
  for (const { filename, size } of IOS_ICONS) {
    await generateIcon(
      svgBuffer,
      path.join(IOS_APPICONSET_DIR, filename),
      size,
    );
  }

  // 3. Chrome Extension Icons
  console.log("\n🌐 Generating Chrome Extension icons...");
  fs.mkdirSync(CHROME_ASSETS_DIR, { recursive: true });
  for (const { filename, size } of CHROME_ICONS) {
    await generateIcon(svgBuffer, path.join(CHROME_ASSETS_DIR, filename), size);
  }

  // 4. App Assets (for Onboarding)
  console.log("\n📲 Generating App assets (Onboarding logo)...");
  fs.mkdirSync(APP_ASSETS_DIR, { recursive: true });
  for (const { filename, size } of APP_ASSETS) {
    await generateIcon(svgBuffer, path.join(APP_ASSETS_DIR, filename), size);
  }

  // 5. Update iOS Contents.json
  console.log("\n📝 Updating iOS AppIcon Contents.json...");
  const contentsJson = {
    images: [
      {
        idiom: "iphone",
        scale: "2x",
        size: "20x20",
        filename: "icon-20@2x.png",
      },
      {
        idiom: "iphone",
        scale: "3x",
        size: "20x20",
        filename: "icon-20@3x.png",
      },
      {
        idiom: "iphone",
        scale: "2x",
        size: "29x29",
        filename: "icon-29@2x.png",
      },
      {
        idiom: "iphone",
        scale: "3x",
        size: "29x29",
        filename: "icon-29@3x.png",
      },
      {
        idiom: "iphone",
        scale: "2x",
        size: "40x40",
        filename: "icon-40@2x.png",
      },
      {
        idiom: "iphone",
        scale: "3x",
        size: "40x40",
        filename: "icon-40@3x.png",
      },
      {
        idiom: "iphone",
        scale: "2x",
        size: "60x60",
        filename: "icon-60@2x.png",
      },
      {
        idiom: "iphone",
        scale: "3x",
        size: "60x60",
        filename: "icon-60@3x.png",
      },
      {
        idiom: "ios-marketing",
        scale: "1x",
        size: "1024x1024",
        filename: "icon-1024.png",
      },
    ],
    info: { author: "xcode", version: 1 },
  };
  fs.writeFileSync(
    path.join(IOS_APPICONSET_DIR, "Contents.json"),
    JSON.stringify(contentsJson, null, 2),
  );
  console.log("  ✅ Contents.json updated");

  console.log("\n🎉 All icons generated successfully!");
  console.log("\n📋 Summary:");
  console.log(
    `   Android: ${ANDROID_ICONS.length} sizes × 2 (standard + round) + ${ANDROID_ADAPTIVE_ICONS.length} foreground`,
  );
  console.log(`   iOS:     ${IOS_ICONS.length} sizes`);
  console.log(`   Chrome:  ${CHROME_ICONS.length} sizes`);
  console.log(`   App:     ${APP_ASSETS.length} sizes (for Onboarding)`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
