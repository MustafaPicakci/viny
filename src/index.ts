import VinyClient from "./node/client/VinyClient.js";
import { createVinyServer } from "./node/factory/CreateVinyServer.js";

const vinyServer = await createVinyServer({
  port: 4000,
  host: "0.0.0.0",
});

vinyServer.start();

try {
  console.log("Hello, World!");

  const client = VinyClient.getInstance();

  const response = await client.register("username", "password");
  console.log("Registration response:", response.data);

  const loginResponse = await client.login("username", "password");
  console.log("Login response:", loginResponse.data);

  await client.connect();

  //   const logoutResponse = await client.logout();
  //   console.log("Logout response:", logoutResponse.data);
} catch (error: any) {
  console.error("An error occurred:", error.data || error.message || error);
}
