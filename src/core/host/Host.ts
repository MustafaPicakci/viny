export type HostMode = "LOCAL" | "CLOUD";

export type Host = {
  id: string;
  name: string;
  address: string;
  port: number;
  mode: HostMode;
};
