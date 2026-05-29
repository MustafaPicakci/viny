import { createVinyServer } from "../../node/factory/CreateVinyServer.js";

export interface ServerOptions {
  name: string;
  port: number;
  address: string;
  mode: "local" | "cloud";
  sqliteFile?: string;
}

export async function serveCommand(options: ServerOptions): Promise<void> {
  const { name, port, address, mode, sqliteFile } = options;
  const vinyServer = await createVinyServer({
    name,
    port,
    address,
    // mode: mode === "cloud" ? "CLOUD" : "LOCAL",
    // sqliteFile,
  });
  vinyServer.start();

  console.log(`Starting Viny host server with name: ${name}, port: ${port}, address: ${address}, mode: ${mode}, sqliteFile: ${sqliteFile}`);
}
