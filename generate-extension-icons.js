#!/usr/bin/env node
/**
 * Regenerate Chrome Extension icons from the app logo SVG
 */
const sharp = require("sharp");
const path = require("path");

const LOGO = path.join(__dirname, "app", "src", "assets", "logo.svg");
const ASSETS = path.join(__dirname, "chrome-extension", "assets");

const sizes = [
  { png: "icon16.png", size: 16 },
  { png: "icon32.png", size: 32 },
  { png: "icon48.png", size: 48 },
  { png: "icon128.png", size: 128 },
];

async function main() {
  console.log("🌐 Regenerating Chrome Extension icons from logo.svg...\n");

  for (const { png, size } of sizes) {
    const pngPath = path.join(ASSETS, png);

    await sharp(LOGO, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`  ✅ ${png} (${size}x${size})`);
  }

  console.log(
    "\n🎉 Done! Reload the extension in chrome://extensions to see changes.",
  );
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
