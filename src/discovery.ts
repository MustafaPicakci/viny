import mdns from "multicast-dns";

const mdnsInstance = mdns();
const SERVICE_NAME = "_viny._tcp.local";

type HostInfo = { name: string; port: number };

type MdnsRecord = {
  name: string;
  type: string;
  data: any;
  ttl?: number;
};

function getAllRecords(response: any): MdnsRecord[] {
  return [...(response?.answers ?? []), ...(response?.additionals ?? [])];
}

export function discoverHosts(timeout = 3000): Promise<HostInfo[]> {
  return new Promise((resolve) => {
    const hosts: HostInfo[] = [];

    const onResponse = (response: any) => {
      const records = getAllRecords(response);
      const ptrs = records.filter((a) => a.type === "PTR" && a.name === SERVICE_NAME);

      for (const ptr of ptrs) {
        const instanceName = ptr.data as string;
        const srv = records.find((a) => a.type === "SRV" && a.name === instanceName);

        if (!srv) continue;

        const name = instanceName.replace(`.${SERVICE_NAME}`, "");
        if (!hosts.find((h) => h.name === name)) {
          hosts.push({ name, port: srv.data.port });
        }
      }
    };

    mdnsInstance.on("response", onResponse);

    mdnsInstance.query({
      questions: [{ name: SERVICE_NAME, type: "PTR" }],
    });

    setTimeout(() => {
      mdnsInstance.removeListener("response", onResponse);
      resolve(hosts);
    }, timeout);
  });
}

export function findByName(name: string, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      mdnsInstance.removeListener("response", onResponse);
    };

    const finish = (value: boolean) => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve(value);
    };

    const onResponse = (response: any) => {
      const records = getAllRecords(response);
      const ptrs = records.filter((a) => a.type === "PTR" && a.name === SERVICE_NAME);

      for (const ptr of ptrs) {
        const foundName = (ptr.data as string).replace(`.${SERVICE_NAME}`, "");

        if (foundName === name) {
          finish(true);
          return;
        }
      }
    };

    mdnsInstance.on("response", onResponse);

    mdnsInstance.query({
      questions: [{ name: SERVICE_NAME, type: "PTR" }],
    });

    setTimeout(() => finish(false), timeout);
  });
}

export function registerHost(name: string, port: number = 3000) {
  const serviceName = `${name}.${SERVICE_NAME}`;
  const packet = {
    answers: [
      {
        name: SERVICE_NAME,
        type: "PTR" as const,
        ttl: 120,
        data: serviceName,
      },
      {
        name: serviceName,
        type: "SRV" as const,
        ttl: 120,
        data: {
          port,
          target: `${name}.local`,
          weight: 0,
          priority: 0,
        },
      },
    ],
  };

  const onQuery = (query: any) => {
    const wantsService = query.questions?.some((q: any) => q.name === SERVICE_NAME && (q.type === "PTR" || q.type === "ANY"));

    const wantsInstance = query.questions?.some((q: any) => q.name === serviceName && (q.type === "SRV" || q.type === "ANY"));

    if (!wantsService && !wantsInstance) return;

    mdnsInstance.respond(packet);
  };

  mdnsInstance.on("query", onQuery);
  mdnsInstance.respond(packet);

  console.log(`"${name}" host craeted on local network (port ${port})`);

  return () => {
    mdnsInstance.removeListener("query", onQuery);
    mdnsInstance.respond({
      answers: [
        {
          name: SERVICE_NAME,
          type: "PTR",
          ttl: 0,
          data: serviceName,
        },
        {
          name: serviceName,
          type: "SRV",
          ttl: 0,
          data: {
            port,
            target: `${name}.local`,
            weight: 0,
            priority: 0,
          },
        },
      ],
    });
  };
}
