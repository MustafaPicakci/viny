import fs from "node:fs";
import path from "node:path";
import { VINY_HOME } from "../config/paths.js";

export type KnownHost = {
  fingerprint256: string;
  cert: string;
  addedAt: string;
};

const KNOWN_HOSTS_FILE = path.join(VINY_HOME, "known_hosts.json");

function readAll(): Record<string, KnownHost> {
  if (!fs.existsSync(KNOWN_HOSTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(KNOWN_HOSTS_FILE, "utf8")) as Record<string, KnownHost>;
}

function writeAll(hosts: Record<string, KnownHost>): void {
  fs.mkdirSync(VINY_HOME, { recursive: true });
  fs.writeFileSync(KNOWN_HOSTS_FILE, JSON.stringify(hosts, null, 2), { mode: 0o600 });
}

const key = (host: string, port: number) => `${host}:${port}`;

export default class KnownHosts {
  static get(host: string, port: number): KnownHost | undefined {
    return readAll()[key(host, port)];
  }

  static add(host: string, port: number, entry: Omit<KnownHost, "addedAt">): void {
    const hosts = readAll();
    hosts[key(host, port)] = { ...entry, addedAt: new Date().toISOString() };
    writeAll(hosts);
  }

  static remove(host: string, port: number): boolean {
    const hosts = readAll();
    if (!hosts[key(host, port)]) return false;
    delete hosts[key(host, port)];
    writeAll(hosts);
    return true;
  }
}
