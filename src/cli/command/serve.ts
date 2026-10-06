import chalk from "chalk";
import { createVinyServer, type ServerOptions } from "../../node/factory/CreateVinyServer.js";

export type ServeCommandOptions = Omit<ServerOptions, "tls"> & {
  tls: boolean;
  tlsCert?: string;
  tlsKey?: string;
};

export async function serveCommand(options: ServeCommandOptions): Promise<void> {
  const { name, port, address, mode, tls, tlsCert, tlsKey } = options;
  if (Boolean(tlsCert) !== Boolean(tlsKey)) throw new Error("--tls-cert and --tls-key must be given together.");
  if (!tls && tlsCert) throw new Error("--no-tls cannot be combined with --tls-cert/--tls-key.");

  const vinyServer = await createVinyServer({
    name,
    port,
    address,
    mode,
    ...(!tls ? { tls: false } : tlsCert && tlsKey ? { tls: { certPath: tlsCert, keyPath: tlsKey } } : {}),
  });
  vinyServer.start();

  console.log(`Starting Viny host server with name: ${name}, port: ${port}, address: ${address}, mode: ${mode}`);
  if (!vinyServer.tls) {
    console.log(chalk.yellow("TLS disabled: traffic is unencrypted. Only use this behind a TLS-terminating proxy."));
  } else if (vinyServer.tls.selfSigned) {
    console.log(`TLS: self-signed certificate. Clients will be asked to confirm this fingerprint on first connect:`);
    console.log(chalk.bold(`  SHA-256 ${vinyServer.tls.fingerprint256}`));
  } else {
    console.log(`TLS: using certificate ${tlsCert}`);
  }
}
