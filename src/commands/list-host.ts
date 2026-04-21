import inquirer from "inquirer";
import { discoverHosts } from "../discovery.js";

export async function listHosts() {
  // mDNS'ten gelen hostlar
  const hosts = (await discoverHosts()).map((h) => `${h.name} - (${h.port})`);

  const { host } = await inquirer.prompt([
    {
      type: "list",
      name: "host",
      message: "Bir host seç:",
      choices: hosts,
    },
  ]);

  //check if exists
  if (!hosts.includes(host)) {
    console.log("Seçilen host bulunamadı");
    return;
  }

  console.log(`${host} seçildi`);
}
