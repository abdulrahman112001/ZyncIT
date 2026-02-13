// Generate a proper Chrome Extension key pair
// This creates a stable extension ID across all machines
const crypto = require("crypto");

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "der",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// Chrome expects the public key as base64 without headers
const base64Key = publicKey.toString("base64");

// Calculate extension ID from public key (Chrome uses first 16 bytes of SHA256 hash)
const hash = crypto.createHash("sha256").update(publicKey).digest();
const extensionId = Array.from(hash.slice(0, 16))
  .map((b) => String.fromCharCode((b % 26) + 97))
  .join("");

console.log("=".repeat(60));
console.log("CHROME EXTENSION KEY GENERATED");
console.log("=".repeat(60));
console.log("");
console.log("Extension ID:", extensionId);
console.log("");
console.log("Public Key (for manifest.json):");
console.log(base64Key);
console.log("");
console.log("=".repeat(60));
console.log("");
console.log("NEXT STEPS:");
console.log('1. Copy the Public Key above into manifest.json "key" field');
console.log("2. Go to Google Cloud Console:");
console.log("   https://console.cloud.google.com/apis/credentials");
console.log(
  `3. Edit OAuth 2.0 Client ID: 723637478368-qq7kihu33tjtson9cfb0espruf66eo41`,
);
console.log(`4. Under "Application type" make sure it's "Chrome Extension"`);
console.log(`5. Add this Extension ID: ${extensionId}`);
console.log("6. Save and rebuild the extension ZIP");
console.log("");

// Save private key for safekeeping
const fs = require("fs");
const path = require("path");
fs.writeFileSync(path.join(__dirname, "extension-private-key.pem"), privateKey);
console.log("Private key saved to: extension-private-key.pem");
console.log("⚠️  KEEP THIS FILE SAFE - DO NOT SHARE OR COMMIT TO GIT");

// Also output JSON-ready key
console.log("");
console.log("manifest.json snippet:");
console.log(`  "key": "${base64Key}"`);
