import { Bonjour, type Browser, type Service } from "bonjour-service";

import type DiscoveryPort from "../../core/discovery/discoveryPort.js";
import type { Host } from "../../core/host/Host.js";

const SERVICE_TYPE = "viny";
export default class DiscoveryAdapter implements DiscoveryPort {
  private readonly bonjour = new Bonjour();
  private service: Service | undefined = undefined;

  async discover(options?: { timeoutMs?: number }): Promise<Host[]> {
    const timeoutMs = options?.timeoutMs ?? 3000;
    const hosts: Host[] = [];

    const browser: Browser = this.bonjour.find({ type: SERVICE_TYPE }, (service: Service) => {
      const txt = (service.txt ?? {}) as { id?: string; mode?: string };
      hosts.push({
        id: txt.id ?? `${service.name}_${service.port}`,
        name: service.name,
        port: service.port,
        address: service.referer?.address ?? "",
        mode: txt.mode === "CLOUD" ? "CLOUD" : "LOCAL",
      });
    });

    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    browser.stop();
    return hosts;
  }
  async publish(name: string): Promise<void> {
    const service = this.bonjour.publish({
      name: name,
      port: 4000,
      type: SERVICE_TYPE,
      protocol: "tcp",
    });
    this.service = service;

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 3000);
      service.on("up", () => {
        clearTimeout(timer);
        resolve();
      });
      service.on("error", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  async unpublish(): Promise<void> {
    if (!this.service) return;
    await new Promise<void>((resolve) => {
      if (typeof this.service?.stop === "function") this.service?.stop(() => resolve());
      else resolve();
    });
    this.service = undefined;
  }
}
