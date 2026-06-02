import chalk from "chalk";
import readline from "node:readline";

import { createInterface } from "readline";
import type { Host } from "../../core/host/Host.js";
import type Session from "../../core/user/Session.js";
import VinyClient from "../../node/client/VinyClient.js";
import { discoverCommand } from "../command/discoverCommand.js";

type CommandHandler = (args: string[]) => Promise<void>;
type Command = { run: CommandHandler; help: string };
export default class Repl {
  private session?: Session;
  private host!: Host;
  private vinyClient!: VinyClient;
  private commands!: Record<string, Command>;
  private rl!: ReturnType<typeof createInterface>;
  private activeConversationId?: number;
  private activeConversationName?: string;
  private stdinClosed = false;
  private queue: string[] = [];
  private processing = false;

  async start() {
    this.commands = this.buildCommands();
    if (this.host) this.vinyClient = VinyClient.getInstance({ address: this.host.address, port: this.host.port });
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.rl = rl;
    this.rl.setPrompt(this.buildPrompt());
    this.rl.prompt();

    this.rl.on("line", (raw) => {
      this.queue.push(raw);
      void this.drain();
    });
    this.rl.on("close", () => {
      this.stdinClosed = true;
      void this.drain();
    });
  }

  private buildPrompt(): string {
    const host = this.host ? `${this.host.address}:${this.host.port}` : "no-host";
    const user = this.session?.username ?? "anonymous";
    const conv = this.activeConversationId !== undefined ? chalk.yellow(` ${this.activeConversationName ?? `#${this.activeConversationId}`}`) : "";
    return chalk.gray(`viny> [${host}] `) + chalk.cyan(user) + conv + chalk.gray(" › ");
  }
  private tokenize(line: string): string[] {
    const out: string[] = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) out.push(m[1] ?? m[2] ?? "");
    return out;
  }
  private async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const raw = this.queue.shift()!.trim();
        if (!raw) continue;
        const [name, ...args] = this.tokenize(raw);
        if (this.activeConversationId !== undefined) {
          if (name === "leave") {
            try {
              await this.commands["leave"]!.run(args);
            } catch (err: any) {
              console.log(chalk.red(err.message));
            }
          } else {
            try {
              await this.ifClientPresent().sendMessage(this.activeConversationId, raw);
            } catch (err: any) {
              console.log(chalk.red(err.message));
            }
          }
        } else {
          const cmd = name ? this.commands[name] : undefined;
          if (!cmd) {
            console.log(chalk.red(`Unknown command: "${name}". Type "help".`));
          } else {
            try {
              await cmd.run(args);
            } catch (err: any) {
              console.log(chalk.red(err.message));
            }
          }
        }
        this.rl.setPrompt(this.buildPrompt());
        if (!this.stdinClosed) this.rl.prompt();
      }
    } finally {
      this.processing = false;
    }
    if (this.stdinClosed && this.queue.length === 0) {
      console.log(chalk.gray("\nbye"));
      await this.vinyClient?.disconnect();
      process.exit(0);
    }
  }

  private ifClientPresent(): VinyClient {
    if (!this.vinyClient) {
      throw new Error("Not connected to any host. Use 'connect' command first.");
    }
    return this.vinyClient;
  }

  private resolveError(err: any): string {
    const data = err?.response?.data;
    if (!data) return err?.message ?? String(err);
    if (typeof data === "string") return data;
    return data.message ?? data.error ?? JSON.stringify(data);
  }

  private printHelp(): void {
    console.log(chalk.bold("Commands:"));
    const names = Object.keys(this.commands).sort();
    const width = Math.max(...names.map((n) => n.length));
    for (const name of names) {
      console.log(`  ${chalk.cyan(name.padEnd(width))}  ${chalk.gray(this.commands[name]!.help)}`);
    }
  }
  private buildCommands(): Record<string, Command> {
    return {
      help: { help: "Show available commands", run: async () => this.printHelp() },
      exit: { help: "Quit the REPL", run: async () => this.rl.close() },
      quit: { help: "Quit the REPL", run: async () => this.rl.close() },
      leave: {
        help: "Leave current conversation",
        run: async () => {
          if (!this.activeConversationId) throw new Error("Not in a conversation.");
          delete this.activeConversationId;
          delete this.activeConversationName;
          console.log(chalk.gray("Left conversation."));
        },
      },
      discover: { help: "Discover Viny hosts on the local network", run: async () => discoverCommand() },
      use: {
        help: "use <address> [port]  — port optional for URLs (e.g. use https://abc.ngrok-free.app)",
        run: async ([address, port]) => {
          try {
            if (!address) throw new Error("Usage: use <address> [port]");
            const isUrl = address.startsWith("http://") || address.startsWith("https://");
            if (!isUrl && !port) throw new Error("Usage: use <address> <port>");
            if (this.host) throw new Error("Already connected. Use 'logout' first.");
            const parsedPort = port ? parseInt(port) : undefined;
            this.vinyClient = VinyClient.reset(parsedPort !== undefined ? { address, port: parsedPort } : { address });
            await this.vinyClient.ping();
            this.host = { id: new Date().getTime().toString(), mode: "LOCAL", name: "", address, port: port ? Number(port) : 443 };
            console.log(chalk.green(`Connected to ${address}`));
          } catch (err: any) {
            console.log(chalk.red(`Connection failed: ${err.message}`));
          }
        },
      },
      register: {
        help: "register <username> <password>",
        run: async ([username, password]) => {
          try {
            if (!username || !password) throw new Error("Usage: register <username> <password>");
            const { data } = await this.ifClientPresent().register(username, password);
            console.log(chalk.green(`Registered ${data.username} (#${data.id})`));
          } catch (err: any) {
            console.log(chalk.red(`Registration failed: ${err.message}`));
          }
        },
      },
      login: {
        help: "login <username> <password>",
        run: async ([username, password]) => {
          try {
            if (!username || !password) throw new Error("Usage: login <username> <password>");
            if (this.session) throw new Error("Already logged in. Use 'logout' first.");
            const { data } = await this.ifClientPresent().login(username, password);

            this.session = data;
            // console.log(chalk.green(`Logged in as ${data.username} (#${data.id})`));
            await this.attachListener();
          } catch (err: any) {
            console.log(chalk.red(`Login failed: ${err.message}`));
          }
        },
      },
      logout: {
        help: "Drop in-memory session",
        run: async () => {
          try {
            await this.vinyClient?.disconnect();
            delete this.session;
            if (this.host) this.vinyClient = VinyClient.getInstance({ address: this.host.address, port: this.host.port });
            console.log(chalk.gray("Logged out"));
          } catch (err: any) {
            console.log(chalk.red(`Logout failed: ${err.message}`));
          }
        },
      },
      users: {
        help: "users <query> — search users",
        run: async ([query]) => {
          try {
            const { data } = await this.ifClientPresent().searchUsers(query || "");
            if (data.length === 0) return console.log(chalk.yellow("No users."));

            for (const u of data) console.log(` ${chalk.green(u.username)}`);
          } catch (err: any) {
            console.log(chalk.red(`Search failed: ${err.message}`));
          }
        },
      },
      "show-participants": {
        help: "show-participants <groupName> — list members of a room",
        run: async ([groupName]) => {
          try {
            const name = groupName || this.activeConversationName;
            if (!name) throw new Error("Usage: show-participants <groupName>");
            const { data } = await this.ifClientPresent().getRoomParticipants(name);
            if (data.length === 0) return console.log(chalk.yellow("No participants."));
            for (const u of data) console.log(` ${chalk.green(u.username)}`);
          } catch (error: any) {
            console.log(chalk.red(this.resolveError(error)));
          }
        },
      },
      "create-room": {
        help: "create-room <name> — create a new room",
        run: async ([name]) => {
          try {
            if (!name) throw new Error("Usage: create-room <name>");
            const { data } = await this.ifClientPresent().createRoom(name);
            console.log(chalk.green(`Room created: ${data.name} (#${data.id})`));
          } catch (error: any) {
            console.log(chalk.red(this.resolveError(error)));
          }
        },
      },
      "add-participant": {
        help: "add-participant <groupName> <username> — add a participant to a room",
        run: async ([groupName, username]) => {
          try {
            if ((!groupName && !this.activeConversationId) || !username) throw new Error("Usage: add-participant <groupName> <username>");
            const { data } = await this.ifClientPresent().addRoomParticipant(groupName || this.activeConversationName!, username);
            console.log(chalk.green(`Participant added: ${username} (#${data.id})`));
          } catch (error: any) {
            console.log(chalk.red(this.resolveError(error)));
          }
        },
      },
      dm: {
        help: "dm <username> — create a new direct message",
        run: async ([username]) => {
          try {
            if (!username) throw new Error("Usage: create-dm <username>");
            const { data } = await this.ifClientPresent().dmUser(username);
            this.activeConversationId = data.id;
            this.activeConversationName = `DM#${username}`;

            const { data: messages } = await this.ifClientPresent().fetchMessages(data.id);
            if (messages.length === 0) {
              console.log(chalk.gray("(no previous messages)"));
            } else {
              for (const m of messages) {
                const time = new Date(m.timestamp ?? m.createdAt).toLocaleString();
                const user = m.senderId === this.session?.userId ? this.session?.username : username;
                console.log(chalk.gray(`[${time}] `) + chalk.cyan(`${user}`) + chalk.gray(" › ") + m.text);
              }
            }
          } catch (error: any) {
            console.log(chalk.red(this.resolveError(error)));
          }
        },
      },

      conversations: {
        help: "List your conversations",
        run: async () => {
          try {
            const { data } = await this.ifClientPresent().listConversations();
            if (data.length === 0) return console.log(chalk.yellow("No conversations."));
            for (const c of data) {
              const label = c.type === "DM" ? `${c.name}` : `"${c.name ?? ""}"`;
              console.log(` ${chalk.cyan(c.type)} (${label})`);
            }
          } catch (error: any) {
            console.log(chalk.red(this.resolveError(error)));
          }
        },
      },

      messages: {
        help: "messages <conversationId>",
        run: async ([id]) => {
          try {
            if (!id) throw new Error("Usage: messages <conversationId>");
            const { data } = await this.ifClientPresent().fetchMessages(Number(id));
            if (data.length === 0) return console.log(chalk.yellow("No messages."));
            for (const m of data) {
              console.log(chalk.gray(`[${m.createdAt.toLocaleString()}]`) + ` ${chalk.cyan(`user:${m.senderId}`)} → ${m.text}`);
            }
          } catch (error: any) {
            console.log(chalk.red(this.resolveError(error)));
          }
        },
      },
    };
  }
  private async attachListener(): Promise<void> {
    if (!this.vinyClient) return;

    try {
      await this.vinyClient.connect();
      this.vinyClient.onMessage((msg) => {
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        const time = msg.timestamp.toLocaleTimeString();
        const inActive = msg.conversationId === this.activeConversationId;
        const convLabel = inActive ? "" : chalk.gray(`[conv#${msg.conversationName}] `);
        process.stdout.write("\x07");
        console.log(chalk.gray(`[${time}] `) + convLabel + chalk.cyan(`${msg.senderUsername}`) + chalk.gray(" › ") + msg.text);
        this.rl.prompt(true);
      });
    } catch (err: any) {
      console.log(chalk.yellow(`WS connect failed: ${err.message}`));
    }
  }
}
