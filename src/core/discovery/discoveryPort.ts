import type { Host } from "../host/Host.js";

export default interface DiscoveryPort {
  discover(): Promise<Host[]>;
  publish(name: string): Promise<void>;
  unpublish(): Promise<void>;
}
