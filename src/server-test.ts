import { createVinyServer } from "./node/factory/CreateVinyServer.js";

const vinyServer = await createVinyServer({
  port: 4000,
  address: "0.0.0.0",
  name: "My Viny Server",
});

vinyServer.start();
