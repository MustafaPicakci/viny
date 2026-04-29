import { Bonjour } from "bonjour-service";
import ora from "ora";

const mdnsInstance = new Bonjour({}, (err: any) => {
  if (err) {
    console.error("mDNS Başlatılamadı:", err);
  }
});

type HostInfo = { name: string; port: number };

type MdnsRecord = {
  name: string;
  type: string;
  data: any;
  ttl?: number;
};

function getAllRecords(response: any): MdnsRecord[] {
  return [...(response?.answers ?? []), ...(response?.additionals ?? [])];
}

export function discoverHosts(timeout = 5000): Promise<HostInfo[]> {
  return new Promise((resolve) => {
    const spinner = ora().start("Aktif Sunucular aranıyor...");
    const hosts: HostInfo[] = [];

    mdnsInstance.find({ type: "viny" }, function (service) {
      hosts.push({ name: service.name, port: service.port });
    });

    setTimeout(() => {
      spinner.stop();
      resolve(hosts);
    }, timeout);
  });
}

export function registerHost(name: string, port: number = 4000) {
  const s = mdnsInstance.publish({
    name: name,
    type: "viny",
    protocol: "tcp",
    port,
  });
  s.on("up", () => {
    console.log("Şimdi yayınlandı! Published:", s);
  });

  console.log(`"${name}" host craeted on local network (port ${port})`);
}

export function closeMdns() {
  console.log("mDNS kayıtları kapatılıyor...");

  mdnsInstance.unpublishAll(() => {
    mdnsInstance.destroy();
    console.log("mDNS tamamen kapatıldı.");
  });
}
