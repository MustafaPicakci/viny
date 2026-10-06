#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import figlet from "figlet";
import { discoverCommand } from "./command/discoverCommand.js";
import { serveCommand } from "./command/serve.js";
import Repl from "./repl/Repl.js";

function displayAppName(): Promise<void> {
  return new Promise((resolve) => {
    figlet("Viny CLI", function (err, data) {
      if (err) {
        resolve();
        return;
      }
      console.log(chalk.cyan(data));
      resolve();
    });
  });
}

const program = new Command();
program.name("viny").description("Viny messaging").version("0.1.0");

program
  .command("serve")
  .description("Start a Viny host server")
  .requiredOption("-n, --name <name>", "host display name")
  .option("-p, --port <port>", "port", "4000")
  .option("-a, --address <address>", "bind address", "0.0.0.0")
  .option("-m, --mode <mode>", "local | cloud", "local")
  .option("--tls-cert <path>", "TLS certificate chain in PEM (e.g. Let's Encrypt fullchain.pem); defaults to a self-signed certificate")
  .option("--tls-key <path>", "private key in PEM for --tls-cert")
  .option("--no-tls", "serve plain HTTP (only behind a proxy that terminates TLS)")
  .action(async (opts) => {
    await displayAppName();
    await serveCommand(opts);
  });

program.command("discover").description("Discover Viny hosts on the local network").action(discoverCommand);

if (process.argv.length <= 2) {
  displayAppName().then(() =>
    new Repl().start().catch((err: Error) => {
      console.error(chalk.red(err.message));
      process.exit(1);
    }),
  );
} else {
  program.parseAsync(process.argv).catch((err: Error) => {
    console.error(chalk.red(err.message));
    process.exit(1);
  });
}
