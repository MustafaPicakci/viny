import chalk from "chalk";
import readline from "node:readline";
import { createInterface } from "readline";
import type { Host } from "../../core/host/Host.js";
import type Session from "../../core/user/Session.js";
import VinyClient from "../../node/client/VinyClient.js";
import { discoverCommand } from "../command/discoverCommand.js";

type CommandHandler = (args: string[]) => Promise<void>;
export default class Repl {
  private session?: Session;
  private host!: Host;
  private vinyClient!: VinyClient;
  private commands!: Record<string, { run: CommandHandler; help: string }>;
  private rl!: ReturnType<typeof createInterface>;
  private activeConversationId?: number;
  private activeConversationPeerId?: number;
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
    const user = this.session?.username ?? "anon";
    const conv = this.activeConversationId !== undefined ? chalk.yellow(` ${this.activeConversationName ?? `#${this.activeConversationId}`}`) : "";
    return chalk.gray(`[${host}] `) + chalk.cyan(user) + conv + chalk.gray(" › ");
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
        const cmd = name ? this.commands[name] : undefined;
        if (!cmd) {
          if (this.activeConversationId !== undefined) {
            try {
              await this.ifClientPresent().sendMessage(this.activeConversationId, raw);
            } catch (err) {
              console.log(chalk.red((err as Error).message));
            }
          } else {
            console.log(chalk.red(`Unknown command: "${name}". Type "help".`));
          }
        } else {
          try {
            await cmd.run(args);
          } catch (err) {
            console.log(chalk.red((err as Error).message));
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

  private printHelp(): void {
    console.log(chalk.bold("Commands:"));
    const names = Object.keys(this.commands).sort();
    const width = Math.max(...names.map((n) => n.length));
    for (const name of names) {
      console.log(`  ${chalk.cyan(name.padEnd(width))}  ${chalk.gray(this.commands[name]!.help)}`);
    }
  }
  private buildCommands(): Record<string, { run: CommandHandler; help: string }> {
    return {
      help: { help: "Show available commands", run: async () => this.printHelp() },
      exit: { help: "Quit the REPL", run: async () => this.rl.close() },
      quit: { help: "Quit the REPL", run: async () => this.rl.close() },
      discover: { help: "Discover Viny hosts on the local network", run: async () => discoverCommand() },
      use: {
        help: "use <address> <port>",
        run: async ([address, port]) => {
          if (!address || !port) throw new Error("Usage: use <address> <port>");
          this.host = { id: new Date().getTime().toString(), mode: "LOCAL", name: "", address, port: Number(port) };

          this.vinyClient = VinyClient.getInstance({ address, port: parseInt(port) });
          //   await this.vinyClient.connect();
          console.log(chalk.green(`Connected to ${address}:${port}`));
        },
      },
      register: {
        help: "register <username> <password>",
        run: async ([username, password]) => {
          if (!username || !password) throw new Error("Usage: register <username> <password>");
          const { data } = await this.ifClientPresent().register(username, password);
          console.log(chalk.green(`Registered ${data.username} (#${data.id})`));
        },
      },
      login: {
        help: "login <username> <password>",
        run: async ([username, password]) => {
          if (!username || !password) throw new Error("Usage: login <username> <password>");

          const { data } = await this.ifClientPresent().login(username, password);

          this.session = data;
          // console.log(chalk.green(`Logged in as ${data.username} (#${data.id})`));
          await this.attachListener();
        },
      },
      logout: {
        help: "Drop in-memory session",
        run: async () => {
          await this.vinyClient?.disconnect();
          delete this.session;
          if (this.host) this.vinyClient = VinyClient.getInstance({ address: this.host.address, port: this.host.port });
          console.log(chalk.gray("Logged out"));
        },
      },
      users: {
        help: "users <query> — search users",
        run: async ([query]) => {
          if (!query) throw new Error("Usage: users <query>");
          const { data } = await this.ifClientPresent().searchUsers(query);
          if (data.length === 0) return console.log(chalk.yellow("No users."));

          for (const u of data) console.log(`${chalk.gray(`#${u.id}`)} ${chalk.green(u.username)}`);
        },
      },
      "create-room": {
        help: "create-room <name> — create a new room",
        run: async ([name]) => {
          if (!name) throw new Error("Usage: create-room <name>");
          const { data } = await this.ifClientPresent().createRoom(name);
          console.log(chalk.green(`Room created: ${data.name} (#${data.id})`));
        },
      },
      "add-participant": {
        help: "add-participant <conversationId> <username> — add a participant to a room",
        run: async ([conversationId, username]) => {
          if ((!conversationId && !this.activeConversationId) || !username) throw new Error("Usage: add-participant <conversationId> <username>");
          const { data } = await this.ifClientPresent().addRoomParticipant(Number(conversationId) || this.activeConversationId!, username);
          console.log(chalk.green(`Participant added: ${data.username} (#${data.id})`));
        },
      },
      dm: {
        help: "dm <username> — create a new direct message",
        run: async ([username]) => {
          if (!username) throw new Error("Usage: create-dm <username>");
          const { data } = await this.ifClientPresent().dmUser(username);
          // console.log(chalk.green(`DM created: ${data.name} (#${data.id})`));
          this.activeConversationId = data.id;
          // this.activeConversationName = username;

          this.activeConversationName = `DM#${username}`;
        },
      },

      conversations: {
        help: "List your conversations",
        run: async () => {
          const { data } = await this.ifClientPresent().listConversations();
          if (data.length === 0) return console.log(chalk.yellow("No conversations."));
          for (const c of data) {
            const label = c.type === "DM" ? `DM (${c.conversationKey})` : `Room "${c.name ?? ""}"`;
            console.log(`${chalk.gray(`#${c.id}`)} ${chalk.cyan(c.type)} ${label}`);
          }
        },
      },

      messages: {
        help: "messages <conversationId>",
        run: async ([id]) => {
          if (!id) throw new Error("Usage: messages <conversationId>");
          const { data } = await this.ifClientPresent().fetchMessages(Number(id));
          if (data.length === 0) return console.log(chalk.yellow("No messages."));
          for (const m of data) {
            console.log(chalk.gray(`[${m.createdAt.toLocaleString()}]`) + ` ${chalk.cyan(`user:${m.senderId}`)} → ${m.text}`);
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
        console.log(msg);
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        const time = msg.timestamp.toLocaleTimeString();
        const inActive = msg.conversationId === this.activeConversationId;
        const convLabel = inActive ? "" : chalk.gray(`[conv#${msg.conversationName}] `);
        console.log(chalk.gray(`[${time}] `) + convLabel + chalk.cyan(`${msg.senderUsername}`) + chalk.gray(" › ") + msg.text);
        this.rl.prompt(true);
      });
    } catch (err) {
      console.log(chalk.yellow(`WS connect failed: ${(err as Error).message}`));
    }
  }
}
