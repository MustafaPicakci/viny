import fs from "fs";
import inquirer from "inquirer";
import os from "os";
import path from "path";

interface Config {
  username: string;
}

const CONFIG_DIR = process.env.VINY_CONFIG ? path.join(process.env.VINY_CONFIG, ".viny") : path.join(os.homedir(), ".viny");

const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

async function askUsername(): Promise<string> {
  return inquirer
    .prompt([
      {
        type: "input",
        name: "username",
        message: "Select your username:",
        validate: (input) => {
          if (input.trim() === "") {
            return "Please enter a valid username.";
          }
          return true;
        },
      },
    ])
    .then((answers) => {
      return answers.username.trim();
    });
}

export async function loadConfig(): Promise<Config> {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as Config;
  }

  const username = await askUsername();
  const config: Config = { username };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");

  console.log(`Hoş geldin, ${username}!`);
  return config;
}
