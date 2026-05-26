export interface ServerOptions {
  port: number;
  host: string;
}
export interface VinyServer {
  start(): Promise<void>;
  stop(): Promise<void>;
}
