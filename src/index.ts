#!/usr/bin/env node
import { Command } from "commander";
import type { REPLServer } from "repl";
import { start } from "repl";

const program = new Command();
program.exitOverride();
// const config = await loadConfig();

// config.username && console.log(chalk.green(`👋 Merhaba, ${config.username}!`));
import { closeHost } from "./commands/close-host.js";
import { createHost } from "./commands/create-host.js";
import { listHosts } from "./commands/list-host.js";

const listHostsCmd = program.command("list-hosts");
listHostsCmd.exitOverride().action(async () => {
  await listHosts();
});

let replServer: REPLServer;

const createHostsCmd = program.command("create-host [name]");
createHostsCmd.exitOverride().action(async (name?: string) => {
  await createHost(
    name,
    (message) =>
      new Promise((resolve) => {
        replServer.question(message, resolve);
      }),
  );
});

const closeHostsCmd = program.command("close-host");
closeHostsCmd.exitOverride().action(async () => {
  await closeHost(
    (message) =>
      new Promise((resolve) => {
        replServer.question(message, (answer) => {
          const normalized = answer.trim().toLowerCase();
          resolve(normalized === "y" || normalized === "yes");
        });
      }),
  );
});
replServer = start({
  prompt: "viny> ",
  ignoreUndefined: true,
  eval: async (cmd, context, filename, callback) => {
    const args = cmd.trim().split(" ");
    try {
      await program.parseAsync(args, { from: "user" });
    } catch (err) {
      // hataları yakala, REPL ölmesin
    }
    callback(null, undefined);
  },
});

// announceJoin();
// listenAnnouncements();
// // renderPeers();

// process.on("SIGINT", async () => {
//   await announceLeave(config.username);
//   console.log("yukarı");

//   process.exit(0);
// });

// process.on("SIGTERM", async () => {
//   console.log("aşağı");
//   await announceLeave(config.username);
//   process.exit(0);
// });

// program
//   .command("connect <accountName>")
//   .description("Create a an account")
//   .action((accountName) => {
//     console.log(chalk.blue(`🚀 Launching ${accountName}...`));
//   });

// program.parse(process.argv);
