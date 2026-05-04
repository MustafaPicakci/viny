import { db } from "../repository/Connection.js";
import { HostRepository } from "../repository/HostRepository.js";

export type ContainerKey = "HostRepository" | "db";

type Dependencies = {
  db: typeof db;
  HostRepository: HostRepository;
};

type Providers = {
  [K in ContainerKey]: () => Dependencies[K];
};

// type ContainerDependencies = {
//   HostRepository: HostRepository;
//   db: typeof db;
// };

export default class Container {
  private static readonly instances = new Map<ContainerKey, Dependencies[ContainerKey]>();

  //   public static register<K extends ContainerKey>(key: K, value: ContainerDependencies[K]) {
  //     Container.ctx.set(key, value);
  //   }

  private static readonly providers: Providers = {
    db: () => db,
    HostRepository: () => new HostRepository(Container.resolve("db")),
  };

  public static resolve<K extends ContainerKey>(key: K): Dependencies[K] {
    if (!Container.instances.has(key)) {
      const provider = Container.providers[key];
      if (!provider) {
        throw new Error(`No provider found for key: ${key}`);
      }
      const instance = provider();
      Container.instances.set(key, instance);
    }
    return Container.instances.get(key) as Dependencies[K];
  }
}
