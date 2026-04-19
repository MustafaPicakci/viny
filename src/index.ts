#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { announceJoin, announceLeave, listenAnnouncements } from "./discovery.js";

const program = new Command();

const config = await loadConfig();

config.username && console.log(chalk.green(`👋 Merhaba, ${config.username}!`));

announceJoin();
listenAnnouncements();
// renderPeers();

process.on("SIGINT", async () => {
  await announceLeave(config.username);
  console.log("yukarı");

  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("aşağı");
  await announceLeave(config.username);
  process.exit(0);
});

// program
//   .command("connect <accountName>")
//   .description("Create a an account")
//   .action((accountName) => {
//     console.log(chalk.blue(`🚀 Launching ${accountName}...`));
//   });

// program.parse(process.argv);
