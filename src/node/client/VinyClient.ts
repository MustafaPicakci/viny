import axios from "axios";
axios.defaults.baseURL = "http://localhost:4000";
export default class VinyClient {
  private static instance: VinyClient;

  private constructor() {}

  public static getInstance(): VinyClient {
    if (!VinyClient.instance) {
      VinyClient.instance = new VinyClient();
    }
    return VinyClient.instance;
  }
  async register(username: string, password: string) {
    return axios.post("/api/auth/register", { username, password });
  }

  async login(username: string, password: string) {
    return axios.post("/api/auth/login", { username, password });
  }

  async logout() {
    return axios.get("/api/auth/logout");
  }

  async connect() {}
}
