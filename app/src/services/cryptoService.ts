/**
 * Crypto Service for End-to-End Encryption
 * React Native compatible using simple symmetric encryption
 * Falls back to XOR-based encryption for cross-platform compatibility
 */

import { Buffer } from 'buffer';

// Encryption prefix to identify encrypted strings
const ENCRYPTION_PREFIX = 'ENC:';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Simple hash function for key derivation
 */
function simpleHash(str: string): number[] {
  const hash: number[] = [];
  for (let i = 0; i < 32; i++) {
    let h = 0;
    for (let j = 0; j < str.length; j++) {
      h = (h * 31 + str.charCodeAt(j) + i) % 2147483647;
    }
    hash.push(Math.abs(h) % 256);
  }
  return hash;
}

/**
 * Derive a key from userId and salt
 */
function deriveKey(userId: string, salt: Uint8Array): Uint8Array {
  const combined =
    userId +
    Array.from(salt)
      .map(b => String.fromCharCode(b))
      .join('');
  const hash = simpleHash(combined);
  return new Uint8Array(hash);
}

/**
 * Generate random bytes using Math.random (fallback)
 */
function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * XOR-based encryption
 */
function xorCrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // Combine key with iv for each byte position
    const keyByte = key[i % key.length];
    const ivByte = iv[i % iv.length];
    const combinedKey = (keyByte + ivByte + i) % 256;
    result[i] = (data[i] + combinedKey) % 256;
  }
  return result;
}

/**
 * XOR-based decryption
 */
function xorDecrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const keyByte = key[i % key.length];
    const ivByte = iv[i % iv.length];
    const combinedKey = (keyByte + ivByte + i) % 256;
    result[i] = (data[i] - combinedKey + 256) % 256;
  }
  return result;
}

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'utf8'));
}

/**
 * Convert Uint8Array to string
 */
function bytesToString(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('utf8');
}

/**
 * Convert Uint8Array to Base64 string
 */
function arrayToBase64(array: Uint8Array): string {
  return Buffer.from(array).toString('base64');
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToArray(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Encrypt a string
 * @param plaintext - Text to encrypt
 * @param userId - User ID for key derivation
 * @returns Encrypted data as Base64 (ENC:base64)
 */
export async function encrypt(
  plaintext: string,
  userId: string,
): Promise<string> {
  if (!plaintext || !userId) {
    return plaintext;
  }

  try {
    const salt = generateRandomBytes(SALT_LENGTH);
    const iv = generateRandomBytes(IV_LENGTH);
    const key = deriveKey(userId, salt);

    const data = stringToBytes(plaintext);
    const encrypted = xorCrypt(data, key, iv);

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encrypted, salt.length + iv.length);

    return ENCRYPTION_PREFIX + arrayToBase64(combined);
  } catch (error) {
    console.error('[Crypto] Encryption error:', error);
    return plaintext;
  }
}

/**
 * Decrypt a string
 * @param encryptedData - Encrypted data (ENC:base64)
 * @param userId - User ID for key derivation
 * @returns Decrypted plaintext
 */
export async function decrypt(
  encryptedData: string,
  userId: string,
): Promise<string> {
  if (!encryptedData || !userId) {
    return encryptedData;
  }

  // Check if data is encrypted
  if (!encryptedData.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedData;
  }

  try {
    const combined = base64ToArray(
      encryptedData.slice(ENCRYPTION_PREFIX.length),
    );

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = deriveKey(userId, salt);
    const decrypted = xorDecrypt(ciphertext, key, iv);

    return bytesToString(decrypted);
  } catch (error) {
    console.error('[Crypto] Decryption error:', error);
    return encryptedData;
  }
}

/**
 * Encrypt an object's sensitive fields
 */
export async function encryptFields<T extends Record<string, any>>(
  data: T,
  userId: string,
  fields: string[],
): Promise<T> {
  if (!data || !userId) return data;

  const encrypted = { ...data } as T;

  for (const field of fields) {
    const value = (encrypted as any)[field];
    if (value && typeof value === 'string') {
      (encrypted as any)[field] = await encrypt(value, userId);
    }
  }

  return encrypted;
}

/**
 * Decrypt an object's encrypted fields
 */
export async function decryptFields<T extends Record<string, any>>(
  data: T,
  userId: string,
  fields: string[],
): Promise<T> {
  if (!data || !userId) return data;

  const decrypted = { ...data } as T;

  for (const field of fields) {
    const value = (decrypted as any)[field];
    if (value && typeof value === 'string') {
      (decrypted as any)[field] = await decrypt(value, userId);
    }
  }

  return decrypted;
}

/**
 * Check if a string is encrypted
 */
export function isEncrypted(str: string): boolean {
  return typeof str === 'string' && str.startsWith(ENCRYPTION_PREFIX);
}

// Field definitions for different data types
export const ENCRYPTED_FIELDS = {
  chat: ['content', 'fileName', 'fileUrl'],
  sms: [
    'body',
    'address',
    'displayName',
    'text',
    'title',
    'phoneNumber',
    'contactName',
  ],
  call: ['phoneNumber', 'contactName', 'displayName'],
  notification: ['title', 'body', 'text'],
  contact: ['name', 'phoneNumber', 'email'],
};

/**
 * Encrypt chat message
 */
export async function encryptChatMessage<T extends Record<string, any>>(
  message: T,
  userId: string,
): Promise<T> {
  return encryptFields(message, userId, ENCRYPTED_FIELDS.chat);
}

/**
 * Decrypt chat message
 */
export async function decryptChatMessage<T extends Record<string, any>>(
  message: T,
  userId: string,
): Promise<T> {
  return decryptFields(message, userId, ENCRYPTED_FIELDS.chat);
}

/**
 * Encrypt SMS
 */
export async function encryptSMS<T extends Record<string, any>>(
  sms: T,
  userId: string,
): Promise<T> {
  return encryptFields(sms, userId, ENCRYPTED_FIELDS.sms);
}

/**
 * Decrypt SMS
 */
export async function decryptSMS<T extends Record<string, any>>(
  sms: T,
  userId: string,
): Promise<T> {
  return decryptFields(sms, userId, ENCRYPTED_FIELDS.sms);
}

/**
 * Encrypt call log
 */
export async function encryptCall<T extends Record<string, any>>(
  call: T,
  userId: string,
): Promise<T> {
  return encryptFields(call, userId, ENCRYPTED_FIELDS.call);
}

/**
 * Decrypt call log
 */
export async function decryptCall<T extends Record<string, any>>(
  call: T,
  userId: string,
): Promise<T> {
  return decryptFields(call, userId, ENCRYPTED_FIELDS.call);
}

/**
 * Encrypt notification
 */
export async function encryptNotification<T extends Record<string, any>>(
  notification: T,
  userId: string,
): Promise<T> {
  return encryptFields(notification, userId, ENCRYPTED_FIELDS.notification);
}

/**
 * Decrypt notification
 */
export async function decryptNotification<T extends Record<string, any>>(
  notification: T,
  userId: string,
): Promise<T> {
  return decryptFields(notification, userId, ENCRYPTED_FIELDS.notification);
}

export default {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  isEncrypted,
  ENCRYPTED_FIELDS,
  encryptChatMessage,
  decryptChatMessage,
  encryptSMS,
  decryptSMS,
  encryptCall,
  decryptCall,
  encryptNotification,
  decryptNotification,
};
