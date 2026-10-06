import { X509Certificate } from "node:crypto";
import net from "node:net";
import tls, { type PeerCertificate } from "node:tls";
import KnownHosts from "./KnownHosts.js";

export type TlsTrust = Pick<tls.ConnectionOptions, "ca" | "checkServerIdentity">;

export type UnknownCertificate = {
  host: string;
  port: number;
  fingerprint256: string;
  subject: string;
  validTo: string;
};

export type UnknownCertificateHandler = (cert: UnknownCertificate) => Promise<boolean>;

export class HostIdentityChangedError extends Error {
  constructor(host: string, port: number, expected: string, actual: string) {
    super(
      [
        `The certificate of ${host}:${port} has CHANGED since you first trusted it.`,
        `This could mean someone is intercepting the connection, or the server certificate was regenerated.`,
        `  trusted : ${expected}`,
        `  received: ${actual}`,
        `If the change is expected, run: forget-host ${host} ${port}`,
      ].join("\n"),
    );
    this.name = "HostIdentityChangedError";
  }
}

// Bundled Mozilla CAs plus the OS trust store, so certificates issued by a company CA
// installed on the machine are accepted without NODE_EXTRA_CA_CERTS or --use-system-ca.
function trustedCertificateAuthorities(): string[] {
  if (typeof tls.getCACertificates !== "function") return [...tls.rootCertificates];
  return [...new Set([...tls.getCACertificates("default"), ...tls.getCACertificates("system")])];
}

type ProbeResult = { cert: PeerCertificate; authorized: boolean; authorizationError?: string };

function probe(host: string, port: number, ca: string[]): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, ca, rejectUnauthorized: false, ...(net.isIP(host) ? {} : { servername: host }) }, () => {
      const cert = socket.getPeerCertificate();
      const authorizationError = socket.authorizationError ? String(socket.authorizationError) : undefined;
      socket.end();
      resolve({ cert, authorized: socket.authorized, ...(authorizationError ? { authorizationError } : {}) });
    });
    socket.setTimeout(5000, () => socket.destroy(new Error(`TLS handshake with ${host}:${port} timed out`)));
    socket.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ERR_SSL_WRONG_VERSION_NUMBER") {
        reject(new Error(`${host}:${port} does not speak TLS. If the server runs with --no-tls, connect with: use http://${host}:${port}`));
      } else reject(err);
    });
  });
}

function pinned(host: string, port: number, fingerprint256: string, cert: string): TlsTrust {
  return {
    ca: cert,
    checkServerIdentity: (_hostname, peer) => (peer.fingerprint256 === fingerprint256 ? undefined : new HostIdentityChangedError(host, port, fingerprint256, peer.fingerprint256)),
  };
}

/**
 * Decides how to trust the server at host:port:
 *  - certificate chains to a trusted CA (Let's Encrypt, company CA) → normal verification
 *  - self-signed and seen before → pinned to the stored fingerprint
 *  - self-signed and new → asks the user (trust on first use) and pins on approval
 */
export async function resolveTlsTrust(host: string, port: number, onUnknownCertificate: UnknownCertificateHandler): Promise<TlsTrust> {
  const ca = trustedCertificateAuthorities();
  const { cert, authorized, authorizationError } = await probe(host, port, ca);
  if (authorized) return { ca };

  const known = KnownHosts.get(host, port);
  if (known) {
    if (known.fingerprint256 !== cert.fingerprint256) throw new HostIdentityChangedError(host, port, known.fingerprint256, cert.fingerprint256);
    return pinned(host, port, known.fingerprint256, known.cert);
  }

  if (authorizationError !== "DEPTH_ZERO_SELF_SIGNED_CERT") {
    throw new Error(`Certificate of ${host}:${port} is not trusted: ${authorizationError}`);
  }

  const approved = await onUnknownCertificate({ host, port, fingerprint256: cert.fingerprint256, subject: [cert.subject?.CN ?? ""].flat()[0] ?? "", validTo: cert.valid_to });
  if (!approved) throw new Error(`Certificate of ${host}:${port} was not trusted.`);

  const pem = new X509Certificate(cert.raw).toString();
  KnownHosts.add(host, port, { fingerprint256: cert.fingerprint256, cert: pem });
  return pinned(host, port, cert.fingerprint256, pem);
}
