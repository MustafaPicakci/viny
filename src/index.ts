export type { default as Conversation } from "./core/conversation/Conversation.js";
export type { Host } from "./core/host/Host.js";
export type { default as Message } from "./core/message/Message.js";
export type { default as SendMessageResponse } from "./core/message/usecase/SendMessageUsecase.js";
export type { default as Session } from "./core/user/Session.js";
export { default as VinyClient, type VinyClientOptions } from "./node/client/VinyClient.js";
export { createVinyServer } from "./node/factory/CreateVinyServer.js";

import { createVinyServer } from "./node/factory/CreateVinyServer.js";

const vinyServer = await createVinyServer({
  port: 4000,
  address: "0.0.0.0",
  name: "My Viny Server",
  mode: "LOCAL",
});
vinyServer.start();
