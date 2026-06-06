import { MongoClient } from 'mongodb';

export interface Env {
  MONGODB_URI?: string;
  MONGODB_DB_NAME?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_JWT_SECRET?: string;
  SB_PROJECT_URL?: string;
  SB_PUBLISHABLE_KEY?: string;
  SB_SECRET_KEY?: string;
}

export interface DBItem {
  id: string;
  title: string;
  description: string;
  category: string;
  owner_id: string;
  owner_email: string;
  owner_phone?: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface DBUser {
  id: string;
  phone: string;
  created_at: string;
}

export interface OTPRecord {
  mobileNo: string;
  otp: string;
  expires_at: number;
  verified: boolean;
}

let cachedMongoClient: MongoClient | null = null;

// Persistent memory sandbox for Cloudflare global scope
export const sandboxDb: DBItem[] = [
  {
    id: "demo-item-1",
    title: "Verify Phone Number OTP",
    description: "Launch the Phone SMS authentication panel below to verify custom 6-digit OTP codes and generate a real security session token.",
    category: "Auth Security",
    owner_id: "user_sandbox_919060873927",
    owner_email: "919060873927@phone-auth.com",
    owner_phone: "919060873927",
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "demo-item-2",
    title: "Custom SMS Gateway config",
    description: "Fires outgoing cellular packets through https://meraotp.in/api/sendSMS API. Fully integrated with standard production models.",
    category: "Gateway Integration",
    owner_id: "user_sandbox_919060873927",
    owner_email: "919060873927@phone-auth.com",
    owner_phone: "919060873927",
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const sandboxUsers: DBUser[] = [
  { id: "user_sandbox_919060873927", phone: "919060873927", created_at: new Date().toISOString() }
];

export const sandboxOtps: OTPRecord[] = [];

export function isConfigured(uri: string | undefined): boolean {
  if (!uri) return false;
  if (uri.includes("your_username") || uri.includes("your_password") || uri.includes("xxxx")) return false;
  return true;
}

export async function getDatabase(env: Env) {
  const uri = env.MONGODB_URI;
  if (!isConfigured(uri)) {
    return null;
  }
  try {
    if (!cachedMongoClient) {
      cachedMongoClient = new MongoClient(uri!, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 5000,
      });
      await cachedMongoClient.connect();
    }
    return cachedMongoClient.db(env.MONGODB_DB_NAME || "cloudflare_backend");
  } catch (error) {
    console.error("MongoDB Atlas connection failure, falling back dynamically to Local Sandbox:", error);
    return null;
  }
}

// WebCrypto JWT decoding and verification
export async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode(secret);
    
    // Import WebCrypto Key with parameters
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode Signature Base64Url to buffer
    const sigBinary = base64UrlToBuffer(signatureB64);
    const signedData = encoder.encode(`${headerB64}.${payloadB64}`);

    // Verify cryptographic MAC signature integrity
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBinary,
      signedData
    );

    if (!isValid) return null;

    // Decode payload JSON values
    const payloadStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Validate claims: check expiration (exp)
    if (payload.exp && (Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch (err) {
    return null; // Signatures invalid, corrupted parser format or expired
  }
}

// WebCrypto JWT creation
export async function createJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encoder = new TextEncoder();
  
  const headerB64 = bufferToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = bufferToBase64Url(encoder.encode(JSON.stringify(payload)));
  
  const secretKeyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signedData = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("HMAC", key, signedData);
  const signatureB64 = bufferToBase64Url(new Uint8Array(signature));
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

function base64UrlToBuffer(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  const binStr = atob(padded);
  const buf = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    buf[i] = binStr.charCodeAt(i);
  }
  return buf;
}

function base64UrlDecode(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64);
}

function bufferToBase64Url(buf: Uint8Array): string {
  let binStr = "";
  for (let i = 0; i < buf.length; i++) {
    binStr += String.fromCharCode(buf[i]);
  }
  return btoa(binStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
