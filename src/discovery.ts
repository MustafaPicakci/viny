import mdns from "multicast-dns";

const mdnsInstance = mdns();

export function discoverHosts(timeout = 3000): Promise<{ name: string; port: number }[]> {
  return new Promise((resolve) => {
    const hosts: { name: string; port: number }[] = [];

    mdnsInstance.on("response", (response: any) => {
      const ptr = response?.answers.find((a: any) => a.type === "PTR" && a.name === "_viny._tcp.local");
      const srv = response?.answers.find((a: any) => a.type === "SRV");

      if (ptr && srv && srv.type === "SRV") {
        const name = (ptr.data as string).replace("._viny._tcp.local", "");
        if (!hosts.find((h) => h.name === name)) {
          hosts.push({ name, port: srv.data.port });
        }
      }
    });

    mdnsInstance.query({
      questions: [{ name: "_viny._tcp.local", type: "PTR" }],
    });

    setTimeout(() => resolve(hosts), timeout);
  });
}

export function findByName(name: string, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    mdnsInstance.on("response", (response: any) => {
      const ptr = response.answers.find((a: any) => a.type === "PTR" && a.name === "_viny._tcp.local");
      if (!ptr) return;

      const foundName = (ptr.data as string).replace("._viny._tcp.local", "");
      if (foundName === name) resolve(true);
    });

    mdnsInstance.query({
      questions: [{ name: "_viny._tcp.local", type: "PTR" }],
    });

    setTimeout(() => resolve(false), timeout);
  });
}

export function registerHost(name: string, port: number = 3000) {
  mdnsInstance.on("query", (query: any) => {
    const match = query.questions.find((q: any) => q.name === "_viny._tcp.local");
    if (!match) return;

    mdnsInstance.respond({
      answers: [
        {
          type: "PTR",
          name: "_viny._tcp.local",
          data: `${name}._viny._tcp.local`,
        },
        {
          type: "SRV",
          name: `${name}._viny._tcp.local`,
          data: { port, target: `${name}.local`, weight: 0, priority: 0 },
        },
      ],
    });
  });

  console.log(`"${name}" host olarak kaydedildi (port ${port})`);
}
