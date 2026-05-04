import { spawn } from "child_process";
import path from "path";

const _dir = import.meta.dirname;

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
  try {
    const selectedName = name?.trim() || (await askName("Bir isim seç: ")).trim();
    console.log(selectedName);

    if (!selectedName) {
      console.log("içerdeee");
      console.log("Host cannot be created without a name.");
      return;
    }

    const runtimeDir = path.resolve(_dir, "..");
    const projectRoot = path.resolve(runtimeDir, "..");
    const isDistRuntime = path.basename(runtimeDir) === "dist";
    const serverEntry = path.resolve(runtimeDir, isDistRuntime ? "server.js" : "server.ts");
    const command = isDistRuntime ? process.execPath : path.resolve(projectRoot, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

    const child = spawn(command, [serverEntry, selectedName], {
      cwd: projectRoot,
      detached: true,
      stdio: "ignore",
    });

    child.unref();
    console.log(`${selectedName} host is being created...`);
  } catch (error) {
    console.error("Error creating host:", error);
  }
}
