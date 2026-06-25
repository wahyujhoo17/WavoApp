import crypto from 'crypto';
import QRCode from 'qrcode';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 secret key.
 */
export function generateSecret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  let value = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      secret += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    secret += ALPHABET[(value << (5 - bits)) & 31];
  }
  return secret;
}

/**
 * Decodes a Base32 string to Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, '');
  const length = cleanInput.length;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));
  
  let bits = 0;
  let value = 0;
  let index = 0;
  
  for (let i = 0; i < length; i++) {
    const char = cleanInput[i];
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    
    value = (value << 5) | idx;
    bits += 5;
    
    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buffer;
}

/**
 * Generates a TOTP code for a given secret at a specific time step and window offset.
 */
export function generateTOTP(secret: string, timeStep = 30, windowOffset = 0): string {
  const secretBytes = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep) + windowOffset;
  
  // Convert counter to 8-byte buffer
  const buffer = Buffer.alloc(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = temp & 0xff;
    temp = temp >> 8;
  }
  
  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secretBytes);
  hmac.update(buffer);
  const hmacResult = hmac.digest();
  
  // Dynamic Truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary = 
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);
    
  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies if a given TOTP token is valid for a secret.
 * Allows a clock drift window of ±1 step.
 */
export function verifyTOTP(token: string, secret: string, timeStep = 30): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  
  // Allow a window of 1 step before/after (total 3 steps checked)
  for (let windowOffset = -1; windowOffset <= 1; windowOffset++) {
    const calculated = generateTOTP(secret, timeStep, windowOffset);
    if (calculated === token) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the otpauth:// URI.
 */
export function getOTPAuthURI(label: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * Generates a QR Code as a Data URI (Base64 PNG).
 */
export async function generateQRCodeDataURI(uri: string): Promise<string> {
  return QRCode.toDataURL(uri);
}
