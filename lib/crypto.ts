const encoder = new TextEncoder();

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
  keyLength: number = 64
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  // Use .buffer to satisfy BufferSource type
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations, hash: "SHA-256" },
    keyMaterial,
    keyLength * 8
  );
  return new Uint8Array(bits);
}

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function hash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await pbkdf2(password, salt);
  return `${toHex(salt)}:${toHex(key)}`;
}

export async function compare(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = fromHex(saltHex);
  const key = await pbkdf2(password, salt);
  return toHex(key) === keyHex;
}
