import chalk from "chalk";
import DiscoveryAdapter from "../../node/discovery/DiscoveryAdapter.js";

export async function discoverCommand(): Promise<void> {
  const discoveryAdapter = new DiscoveryAdapter();

  console.log(chalk.blue("Discovering Viny hosts on the local network..."));

  const hosts = await discoveryAdapter.discover({ timeoutMs: 5000 });
  console.log(chalk.green(`Found ${hosts.length} Viny hosts:`));
  hosts.forEach((host) => {
    console.log(chalk.green(`- ${host.name} (${host.address}:${host.port})`));
  });
}
