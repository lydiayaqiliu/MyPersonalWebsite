#!/usr/bin/env node
// Generates the encrypted-address constants for vault.js.
// Run: node tools/encrypt-vault.js
// Then type the passphrase, press Enter, type the address, press Enter.
// Neither value is ever written to disk or passed as a CLI argument, so
// nothing sensitive ends up in shell history or this file.

const { webcrypto } = require("node:crypto");
const fs = require("node:fs");

const PBKDF2_ITERATIONS = 100000;

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function deriveKey(passphrase, salt) {
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-CTR", length: 256 },
    false,
    ["encrypt"]
  );
}

async function main() {
  const lines = fs.readFileSync(0, "utf8").split("\n");
  const passphrase = (lines[0] || "").trim();
  let address = (lines[1] || "").trim();
  if (!passphrase || !address) {
    console.error("Usage: run interactively (node tools/encrypt-vault.js) and type passphrase then address, each followed by Enter.");
    process.exit(1);
  }
  // Only the address body gets encrypted — vault.js appends ".onion" back
  // literally, so it stays visible as a hint even on the encrypted display.
  address = address.replace(/\.onion$/i, "");

  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const counter = webcrypto.getRandomValues(new Uint8Array(16));

  const key = await deriveKey(passphrase, salt);
  const ciphertext = await webcrypto.subtle.encrypt(
    { name: "AES-CTR", counter, length: 64 },
    key,
    new TextEncoder().encode(address)
  );

  console.log("\nPaste these into the VAULT_* constants at the top of vault.js:\n");
  console.log(`const VAULT_SALT_B64 = "${bytesToBase64(salt)}";`);
  console.log(`const VAULT_IV_B64 = "${bytesToBase64(counter)}";`);
  console.log(`const VAULT_CIPHERTEXT_B64 = "${bytesToBase64(new Uint8Array(ciphertext))}";`);
}

main();
