import ConnectionRegistry from "../../core/transport/ConnectionRegistry.js";
import AuthenticationAdapter from "../auth/AuthenticationAdapter.js";
import db from "../db/Db.js";
import DiscoveryAdapter from "../discovery/DiscoveryAdapter.js";
import VinyServer from "../server/server.js";
import UserAdapter from "../user/UserAdapter.js";

import LoginUsecase from "../../core/auth/usecase/LoginUsecase.js";
import RegisterUsecase from "../../core/auth/usecase/RegisterUsecase.js";
import AddRoomParticipantUsecase from "../../core/conversation/usecase/AddRoomParticioantUsecase.js";
import CreateDMUsecase from "../../core/conversation/usecase/CreateDmUsecase.js";
import CreateRoomUsecase from "../../core/conversation/usecase/CreateRoomUsecase.js";
import JoinRoomUsecase from "../../core/conversation/usecase/JoinRoomUsecase.js";
import ListConversationsUsecase from "../../core/conversation/usecase/ListConversationsUsecase.js";
import FetchMessagesUsecase from "../../core/message/usecase/FetchMessagesUsecase.js";
import SendMessageUsecase from "../../core/message/usecase/SendMessageUsecase.js";
import SearchUserUsecase from "../../core/user/usecase/SearchUserUsecase.js";
import ConversationAdapter from "../conversation/ConversationAdapter.js";
import MessageAdapter from "../message/MessageAdapter.js";
import TransportAdapter from "../transport/TransportAdapter.js";

export interface ServerOptions {
  address: string;
  port: number;
  name: string;
  mode: "LOCAL" | "CLOUD";
}

export interface VinyServerHandle {
  stop(): Promise<void>;
  start(): VinyServer;
}

export async function createVinyServer(options: ServerOptions): Promise<VinyServerHandle> {
  const authAdapter = new AuthenticationAdapter({ jwtSecret: "your-jwt-secret", tokenTtlSeconds: 60 * 60 * 24, bcryptSaltRounds: 10 });
  const userAdapter = new UserAdapter(db);
  const discoveryAdapter = new DiscoveryAdapter();
  const conversationAdapter = new ConversationAdapter(db);
  const messageAdapter = new MessageAdapter(db);
  const registry = new ConnectionRegistry();
  const transportAdapter = new TransportAdapter(registry);
  const server = new VinyServer({
    port: options.port || 4000,
    host: options.address || "0.0.0.0",
    registry,
    authenticationPort: authAdapter,
    userPort: userAdapter,
    usecases: {
      register: new RegisterUsecase(authAdapter, userAdapter),
      login: new LoginUsecase(authAdapter, userAdapter),
      searchUsers: new SearchUserUsecase(userAdapter),
      listConversations: new ListConversationsUsecase(conversationAdapter, userAdapter),
      fetchMessages: new FetchMessagesUsecase(conversationAdapter, messageAdapter),
      createRoom: new CreateRoomUsecase(conversationAdapter),
      addRoomParticipant: new AddRoomParticipantUsecase(conversationAdapter, userAdapter),
      joinRoom: new JoinRoomUsecase(conversationAdapter),
      createDM: new CreateDMUsecase(userAdapter, conversationAdapter),
      sendMessage: new SendMessageUsecase(conversationAdapter, messageAdapter, userAdapter, transportAdapter),
    },
  });

  return {
    start() {
      server.start();
      discoveryAdapter.publish(options.name);

      return server;
    },
    async stop() {
      server.stop();
    },
  };
}
