import { createVinyServer } from "./node/factory/CreateVinyServer.js";

const vinyServer = await createVinyServer({
  port: 4000,
  host: "0.0.0.0",
});

vinyServer.start();
