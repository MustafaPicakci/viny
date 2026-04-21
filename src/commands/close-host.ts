import { spawn } from "child_process";
import { createInterface } from "readline/promises";

type Confirm = (message: string) => Promise<boolean>;

async function askConfirm(): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const options = ["yes", "y", "YES", "Y"];
    const response = (await rl.question("Do you want to close the host? (y/n): ")).trim();
    const accept = options.includes(response);
    if (!accept) {
      return false;
    }

    return true;
  } finally {
    rl.close();
  }
}

export async function closeHost(confirm: Confirm = askConfirm) {
  const check = await confirm("Do you want to close the host? (y/n):");

  if (!Boolean(check)) {
    return new Promise<void>((resolve) => {
      console.log("Canceled");
      resolve();
    });
  }

  return new Promise<void>((resolve, reject) => {
    const kill = spawn("npx", ["kill-port", "4000"], {
      stdio: "inherit",
    });

    kill.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`kill-port exited with code ${code}`));
      } else {
        resolve();
      }
    });

    kill.on("error", (err) => {
      reject(err);
    });
  });
}
