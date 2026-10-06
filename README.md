# viny

> **Early preview — expect rough edges.**

A local-network messaging CLI. Run a server on one machine, connect from others on the same network — no internet, no cloud, no setup beyond Node.

## Install

```bash
npm install -g viny-cli
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
use 192.168.1.100 4000   # connect to the server (confirm its certificate fingerprint the first time)
register alice secret    # create an account
login alice secret       # log in
```

**3. Start chatting:**

```
dm bob                   # open a direct message with bob
# now just type — every line is sent as a message
leave                    # exit the conversation
```

## Example walkthrough

### Machine A — start the server

```bash
$ viny serve --name "office" --port 4000
VinyServer listening on 0.0.0.0:4000
```

### Machine B — discover and connect

```bash
$ viny

viny> [no-host] anonymous ›  discover
Found: office  192.168.1.10:4000

viny> [no-host] anonymous ›  use 192.168.1.10 4000
Connected to 192.168.1.10:4000

viny> [192.168.1.10:4000] anonymous ›  register alice p4ssword
Registered alice (#1)

viny> [192.168.1.10:4000] anonymous ›  login alice p4ssword
```

### Machine C — another user joins

```bash
$ viny

viny> [no-host] anonymous ›  use 192.168.1.10 4000
Connected to 192.168.1.10:4000

viny> [192.168.1.10:4000] anonymous ›  register bob p4ssword
Registered bob (#2)

viny> [192.168.1.10:4000] anonymous ›  login bob p4ssword
```

### Machine B — send a DM

```bash
viny> [192.168.1.10:4000] alice ›  dm bob
(no previous messages)

viny> [192.168.1.10:4000] alice  DM#bob ›  hey bob, are you there?
```

### Machine C — bob receives and replies

```bash
# message appears instantly:
[10:42:01] alice › hey bob, are you there?

viny> [192.168.1.10:4000] bob ›  dm alice
viny> [192.168.1.10:4000] bob  DM#alice ›  yes, loud and clear!
```

---

## Commands

### CLI

```
viny                          Start the interactive REPL
viny serve -n <name>          Start a server on this machine
  -p, --port <port>             Port (default 4000)
  --tls-cert <path>             Certificate chain in PEM (e.g. Let's Encrypt fullchain.pem)
  --tls-key <path>              Private key in PEM for --tls-cert
  --no-tls                      Serve plain HTTP (only behind a proxy/tunnel that terminates TLS)
viny discover                 Discover Viny servers on the local network
```

### REPL

| Command                             | Description                                       |
| ----------------------------------- | ------------------------------------------------- |
| `use <address> [port]`              | Connect to a Viny server over TLS (port optional for URLs; `http://` URL for unencrypted) |
| `forget-host <address> <port>`      | Forget a trusted self-signed certificate          |
| `register <username> <password>`    | Create an account                                 |
| `login <username> <password>`       | Log in                                            |
| `logout`                            | Log out                                           |
| `dm <username>`                     | Open a direct message                             |
| `create-room <name>`                | Create a group room                               |
| `enter-room <name>`                 | Enter a room                                      |
| `add-participant <room> <username>` | Add a user to a room                              |
| `show-participants <room>`          | List members of a room                            |
| `conversations`                     | List your conversations                           |
| `users <query>`                     | Search users                                      |
| `discover`                          | Discover servers on the network                   |
| `leave`                             | Leave the active conversation                     |
| `help`                              | Show available commands                           |
| `exit`                              | Quit                                              |

## SDK usage

You can also embed a Viny server or use the client programmatically:

```ts
import { createVinyServer, VinyClient } from "viny-cli";

// Start a server
const server = await createVinyServer({ port: 4000, address: "0.0.0.0", name: "my-server", mode: "LOCAL" });
server.start();

// Use the client
const client = VinyClient.getInstance({ address: "localhost", port: 4000 });
await client.login("alice", "secret");
```

## Encryption (TLS)

All traffic — messages, passwords and session tokens — is encrypted with TLS by default. How the server's certificate is trusted depends on how it is run:

| Setup | Server | Client |
| --- | --- | --- |
| Local network, no domain | `viny serve -n office` — generates a self-signed certificate once (`~/.viny/tls/`) and prints its SHA-256 fingerprint | On first `use`, shows the fingerprint and asks to trust it. Compare it with the one the server printed. The certificate is then pinned in `~/.viny/known_hosts.json`; if it ever changes, the connection is refused. |
| Server with a domain | `viny serve -n office --tls-cert fullchain.pem --tls-key privkey.pem` — any certificate works: Let's Encrypt, a company CA, a commercial CA | Verified like a browser would, no prompt: `use https://chat.example.com:4000`. Certificates from a company CA installed in the operating system's trust store are accepted (Node.js 22.15+). |
| Behind a tunnel/proxy that already does TLS | `viny serve -n office --no-tls` | `use https://...` (the tunnel's URL) |

When the server's certificate changes on purpose (e.g. `~/.viny/tls/` was deleted), clients must run `forget-host <address> <port>` and trust the new fingerprint.

The server reads `--tls-cert`/`--tls-key` at startup, so restart it after renewing the certificate.

## Connecting over the internet (ngrok)

By default viny works on a local network. To expose a server publicly, use ngrok's HTTP tunnel — it provides HTTPS itself, so run the server with `--no-tls` behind it:

```bash
viny serve -n my-server --port 4000 --no-tls
ngrok http 4000
# → https://abc123.ngrok-free.app
```

Then connect with the full URL (no port needed):

```
use https://abc123.ngrok-free.app
```

## Requirements

- Node.js 20+
- Local network usage: all devices on the same network
- Internet usage: a tunnel (ngrok) or a VPS

## License

ISC
