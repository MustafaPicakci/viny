#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import figlet from "figlet";
import { discoverCommand } from "./command/discoverCommand.js";
import { serveCommand } from "./command/serve.js";
import Repl from "./repl/Repl.js";

// displayAppName();
const program = new Command();
program.name("viny").description("Viny messaging").version("0.1.0");

program
  .command("serve")
  .description("Start a Viny host server")
  .requiredOption("-n, --name <name>", "host display name")
  .option("-p, --port <port>", "port", "4000")
  .option("-a, --address <address>", "bind address", "0.0.0.0")
  .option("-m, --mode <mode>", "local | cloud", "local")
  .action(async (opts) => {
    await serveCommand(opts);
  });

program.command("discover").description("Discover Viny hosts on the local network").action(discoverCommand);

if (process.argv.length <= 2) {
  new Repl().start().catch((err: Error) => {
    console.error(chalk.red(err.message));
    process.exit(1);
  });
} else {
  program.parseAsync(process.argv).catch((err: Error) => {
    console.error(chalk.red(err.message));
    process.exit(1);
  });
}
function displayAppName() {
  figlet("Viny CLI", function (err, data) {
    if (err) {
      console.log("Something went wrong...", err.message);
      console.error(err);
      return;
    }
    console.log(data);
  });
}
