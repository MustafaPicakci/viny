import axios from "axios";
axios.defaults.baseURL = "http://localhost:4000";
export class VinyClient {
  private static instance: VinyClient;

  private constructor() {}

  public static getInstance(): VinyClient {
    if (!VinyClient.instance) {
      VinyClient.instance = new VinyClient();
    }
    return VinyClient.instance;
  }
  async register(username: string, password: string) {
    return axios.post("/api/register", { username, password });
  }

  async login(username: string, password: string) {
    return axios.post("/api/login", { username, password });
  }

  async logout() {
    return axios.get("/api/logout");
  }

  async connect() {}
}
export default VinyClient.getInstance();
