import VinyClient from "./node/client/VinyClient.js";
import DiscoveryAdapter from "./node/discovery/DiscoveryAdapter.js";

// const vinyServer = await createVinyServer({
//   port: 4000,
//   address: "0.0.0.0",
//   name: "My Viny Server",
// });

// vinyServer.start();

try {
  console.log("Hello, World!");

  const client = VinyClient.getInstance();

  //   const response = await client.register("username", "password");
  //   console.log("Registration response:", response.data);

  const loginResponse = await client.login("username", "password");
  console.log("Login response:", loginResponse.data);

  const discoveryAdapter = new DiscoveryAdapter();
  const x = await discoveryAdapter.discover();
  console.log("Discovered hosts:", x);
  await client.connect();

  //   const logoutResponse = await client.logout();
  //   console.log("Logout response:", logoutResponse.data);
} catch (error: any) {
  console.error("An error occurred:", error.data || error.message || error);
}
