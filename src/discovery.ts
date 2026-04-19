import dgram from "node:dgram";

import chalk from "chalk";
import os from "os";
import { loadConfig } from "./config.js";

const config = await loadConfig();

interface DiscoveryMessage {
  type: "join" | "leave";
  username: string;
  timestamp: number;
}

const PORT = 41234;
const BROADCAST_ADDR = "192.168.1.255";
const client = dgram.createSocket({ type: "udp4", reuseAddr: true });

export const peers = new Map<string, { username: string; address: string; port: number; lastSeen: number }>();

const server = dgram.createSocket({ type: "udp4", reuseAddr: true });
server.bind(PORT, () => {
  console.log(`Listening for broadcasts on port ${PORT}`);
});
server.on("error", (err) => {
  console.error(`Server error:\n${err.stack}`);

  server.close();
});

export function announceJoin() {
  client.bind(() => {
    client.setBroadcast(true);

    const message: DiscoveryMessage = {
      type: "join",
      username: config.username,
      timestamp: Date.now(),
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));

    client.send(messageBuffer, PORT, BROADCAST_ADDR, (err) => {
      if (err) console.error(err);
      console.log(`Sent broadcast to ${BROADCAST_ADDR}:${PORT}`);
      //   client.close();
    });
  });
}

export async function announceLeave(username: string) {
  const message: DiscoveryMessage = {
    type: "leave",
    username,
    timestamp: Date.now(),
  };

  const messageBuffer = Buffer.from(JSON.stringify(message));

  peers.delete(username);

  await new Promise<void>((resolve, reject) => {
    client.send(Buffer.from(messageBuffer), PORT, BROADCAST_ADDR, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log(`Sent leave announcement for ${username}`);
  client.close();
}

export function listenAnnouncements() {
  server.on("message", (msg, sender) => {
    const localIP = getLocalIP();

    // if (sender.address === localIP) {
    //   return;
    // }
    const discoveryMessage: DiscoveryMessage = JSON.parse(msg.toString());

    if (discoveryMessage.username === config.username) {
      return;
    }

    if (discoveryMessage.type === "join") {
      handleJoin(msg.toString(), sender);
    } else if (discoveryMessage.type === "leave") {
      handleLeave(msg.toString(), sender);
    }
  });
}

function handleJoin(msg: string, sender: dgram.RemoteInfo) {
  const discoveryMessage: DiscoveryMessage = JSON.parse(msg.toString());
  peers.set(discoveryMessage.username, {
    username: discoveryMessage.username,
    address: sender.address,
    port: sender.port,
    lastSeen: discoveryMessage.timestamp,
  });

  console.log(`Received message: ${JSON.stringify(discoveryMessage)} from ${sender.address}:${sender.port}`);
}

function handleLeave(msg: string, sender: dgram.RemoteInfo) {
  const discoveryMessage: DiscoveryMessage = JSON.parse(msg.toString());
  peers.delete(discoveryMessage.username);

  console.log(`Received message: ${JSON.stringify(discoveryMessage)} from ${sender.address}:${sender.port}`);
}

export function getOnlineUsers() {
  return peers.values().map((peer) => peer.username);
}

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface ?? []) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "127.0.0.1";
}

export function renderPeers() {
  console.clear();
  console.log(chalk.bold("🟢 Aktif Kullanıcılar\n"));

  if (peers.size === 0) {
    console.log(chalk.gray("Henüz kimse yok..."));
    return;
  }

  peers.forEach((peer) => {
    console.log(chalk.green(`• ${peer.username}`) + chalk.gray(` (${peer.address})`));
  });
}
