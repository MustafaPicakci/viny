import { spawn } from "child_process";
import path from "path";

async function askHostName(message: string): Promise<string> {
  const { createInterface } = await import("readline/promises");

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await rl.question(message)).trim();
  } finally {
    rl.close();
  }
}

type AskName = (message: string) => Promise<string>;

export async function createHost(name?: string, askName: AskName = askHostName) {
  const selectedName = name?.trim() || (await askName("Bir isim seç: ")).trim();

  if (!selectedName) {
    console.log("Host cannot be created without a name.");
    return;
  }

  const tsxPath = path.resolve(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

  const child = spawn(tsxPath, ["src/server.ts", selectedName], {
    detached: true,
    stdio: "ignore",
  });

  child.unref();
  console.log(`${selectedName} host is being created...`);
}
