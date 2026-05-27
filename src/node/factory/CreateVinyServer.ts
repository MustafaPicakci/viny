import ConnectionRegistry from "../../core/transport/ConnectionRegistry.js";
import AuthenticationAdapter from "../auth/AuthenticationAdapter.js";
import db from "../db/Db.js";
import DiscoveryAdapter from "../discovery/DiscoveryAdapter.js";
import VinyServer from "../server/server.js";
import UserAdapter from "../user/UserAdapter.js";

export interface ServerOptions {
  address?: string;
  port: number;
  name: string;
}

export interface VinyServerHandle {
  stop(): Promise<void>;
  start(): VinyServer;
}

export async function createVinyServer(options: ServerOptions): Promise<VinyServerHandle> {
  const authAdapter = new AuthenticationAdapter({ jwtSecret: "your-jwt-secret", tokenTtlSeconds: 60 * 60 * 24, bcryptSaltRounds: 10 });
  const userAdapter = new UserAdapter(db);
  const discoveryAdapter = new DiscoveryAdapter();
  const server = new VinyServer({
    port: 4000,
    host: options.address || "0.0.0.0",
    registry: new ConnectionRegistry(),
    authenticationPort: authAdapter,
    userPort: userAdapter,
    usecases: {
      register: new (await import("../../core/auth/usecase/RegisterUsecase.js")).default(authAdapter, userAdapter),
      login: new (await import("../../core/auth/usecase/LoginUsecase.js")).default(authAdapter, userAdapter),
      searchUsers: new (await import("../../core/user/usecase/SearchUserUsecase.js")).default(userAdapter),
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
