# viny

> **Early preview — expect rough edges.**

A local-network messaging CLI. Run a server on one machine, connect from others on the same network — no internet, no cloud, no setup beyond Node.

## Install

```bash
npm install -g viny
```

## Quick start

**1. Start a server** (the machine that will host messages):

```bash
viny serve --name "my-server" --port 4000
```

The terminal must stay open while the server is running. To run it in the background, use [pm2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start "viny serve --name my-server --port 4000" --name viny
pm2 save          # survive reboots
pm2 logs viny     # see logs
pm2 stop viny     # stop the server
```

**2. Connect from any machine on the same network:**

```bash
viny
```

This opens the interactive REPL. From there:

```
use 192.168.1.100 4000   # connect to the server
register alice secret    # create an account
login alice secret       # log in
```

**3. Start chatting:**

```
dm bob                   # open a direct message with bob
# now just type — every line is sent as a message
leave                    # exit the conversation
```

## Commands

### CLI

```
viny                          Start the interactive REPL
viny serve -n <name>          Start a server on this machine
viny discover                 Discover Viny servers on the local network
```

### REPL

| Command | Description |
|---|---|
| `use <address> <port>` | Connect to a Viny server |
| `register <username> <password>` | Create an account |
| `login <username> <password>` | Log in |
| `logout` | Log out |
| `dm <username>` | Open a direct message |
| `create-room <name>` | Create a group room |
| `add-participant <room> <username>` | Add a user to a room |
| `show-participants <room>` | List members of a room |
| `conversations` | List your conversations |
| `users <query>` | Search users |
| `discover` | Discover servers on the network |
| `leave` | Leave the active conversation |
| `help` | Show available commands |
| `exit` | Quit |

## SDK usage

You can also embed a Viny server or use the client programmatically:

```ts
import { createVinyServer, VinyClient } from "viny";

// Start a server
const server = await createVinyServer({ port: 4000, address: "0.0.0.0", name: "my-server", mode: "LOCAL" });
server.start();

// Use the client
const client = VinyClient.getInstance({ address: "localhost", port: 4000 });
await client.login("alice", "secret");
```

## Requirements

- Node.js 20+
- All devices must be on the same local network

## License

ISC
