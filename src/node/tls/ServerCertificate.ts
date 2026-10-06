import { X509Certificate } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generate } from "selfsigned";
import { VINY_HOME } from "../config/paths.js";

export type ServerCertificate = {
  cert: string;
  key: string;
  selfSigned: boolean;
  fingerprint256: string;
};

const TLS_DIR = path.join(VINY_HOME, "tls");
const SELF_SIGNED_CERT = path.join(TLS_DIR, "cert.pem");
const SELF_SIGNED_KEY = path.join(TLS_DIR, "key.pem");
const SELF_SIGNED_VALIDITY_YEARS = 10;

function describe(cert: string, key: string, selfSigned: boolean): ServerCertificate {
  return { cert, key, selfSigned, fingerprint256: new X509Certificate(cert).fingerprint256 };
}

// Generated once and reused, so clients that pinned the fingerprint keep trusting it across restarts.
async function loadOrCreateSelfSigned(): Promise<ServerCertificate> {
  if (fs.existsSync(SELF_SIGNED_CERT) && fs.existsSync(SELF_SIGNED_KEY)) {
    return describe(fs.readFileSync(SELF_SIGNED_CERT, "utf8"), fs.readFileSync(SELF_SIGNED_KEY, "utf8"), true);
  }

  const notAfterDate = new Date();
  notAfterDate.setFullYear(notAfterDate.getFullYear() + SELF_SIGNED_VALIDITY_YEARS);
  const pems = await generate([{ name: "commonName", value: `viny@${os.hostname()}` }], { keyType: "ec", curve: "P-256", notAfterDate });

  fs.mkdirSync(TLS_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(SELF_SIGNED_KEY, pems.private, { mode: 0o600 });
  fs.writeFileSync(SELF_SIGNED_CERT, pems.cert);
  return describe(pems.cert, pems.private, true);
}

/** Uses the given certificate (Let's Encrypt, company CA, ...) or falls back to a self-signed one for LAN use. */
export async function loadServerCertificate(files?: { certPath: string; keyPath: string }): Promise<ServerCertificate> {
  if (!files) return loadOrCreateSelfSigned();
  return describe(fs.readFileSync(files.certPath, "utf8"), fs.readFileSync(files.keyPath, "utf8"), false);
}
