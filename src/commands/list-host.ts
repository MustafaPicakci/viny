import Context from "../context.js";
import { discoverHosts } from "../discovery.js";
type Ask = (message: string) => Promise<string>;

async function ask(message: string): Promise<string> {
  const { createInterface } = await import("readline/promises");

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await rl.question(message)).trim();
  } finally {
    rl.close();
  }
}

export async function listHosts(askUser: Ask = ask) {
  const hosts = await discoverHosts();

  if (hosts.length === 0) {
    console.log("Hiç host bulunamadı");
    return;
  }

  hosts.forEach((host, index) => {
    console.log(`${index + 1}. ${host.name} (${host.port})`);
  });

  const answer = await askUser("Bağlanmak istediğin host numarasını seç: ");
  const selectedIndex = Number.parseInt(answer, 10) - 1;

  if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= hosts.length) {
    console.log("Geçersiz host seçimi");
    return;
  }

  const selectedHost = hosts[selectedIndex];
  Context.getInstance().setHost({ id: "şimdilik null", name: selectedHost?.name!, address: "şimdilik statik local address", port: selectedHost?.port! });
  console.log(`${selectedHost?.name} (${selectedHost?.port}) seçildi`);
}
