import { spawn } from "child_process";
import { createInterface } from "readline/promises";

async function askHostName() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await rl.question("Bir isim seç: ")).trim();
  } finally {
    rl.close();
  }
}

type AskName = (message: string) => Promise<string>;

export async function createHost(name?: string, askName: AskName = askHostName) {
  const selectedName = name?.trim() || (await askName("Bir isim seç: ")).trim();

  if (!selectedName) {
    console.log("Host ismi boş olamaz");
    return;
  }

  const child = spawn("npx", ["tsx", "src/server.ts", selectedName], {
    detached: true,
    stdio: "ignore",
  });

  child.unref();
  console.log(`${selectedName} seçildi`);
}
