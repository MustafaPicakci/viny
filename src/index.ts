console.log("Hello, World!");
import VinyClient from "./code/client/VinyClient.js";

const client = VinyClient;

const response = await client.register("username", "password");
console.log("Registration response:", response.data);

const loginResponse = await client.login("username", "password");
console.log("Login response:", loginResponse.data);

await client.connect();

const logoutResponse = await client.logout();
console.log("Logout response:", logoutResponse.data);
