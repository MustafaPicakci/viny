import { createVinyServer, type ServerOptions } from "../../node/factory/CreateVinyServer.js";

export async function serveCommand(options: ServerOptions): Promise<void> {
  const { name, port, address, mode } = options;
  const vinyServer = await createVinyServer({
    name,
    port,
    address,
    mode,
  });
  vinyServer.start();

  console.log(`Starting Viny host server with name: ${name}, port: ${port}, address: ${address}, mode: ${mode}`);
}
