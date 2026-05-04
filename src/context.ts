export type Host = {
  id: string;
  name: string;
  address: string;
  port: number;
};

export type Room = {
  id: string;
  name: string;
};

export type DMUser = {
  id: string;
  username: string;
};

export interface ContextType {
  host?: Host;
  room?: Room;
  dmUser?: DMUser;
}

export default class Context {
  private static instance: Context;

  private host: Host | undefined;
  private room: Room | undefined;
  private dmUser: DMUser | undefined;

  private constructor() {}

  static getInstance(): Context {
    return Context.instance || (Context.instance = new Context());
  }

  setHost(host: Host) {
    this.host = host;
  }

  setRoom(room: Room) {
    this.room = room;
  }

  setDMUser(dmUser: DMUser) {
    this.dmUser = dmUser;
  }

  getDMUser() {
    return this.dmUser;
  }
  getHost() {
    return this.host;
  }
  getRoom() {
    return this.room;
  }

  clear() {
    this.host = undefined;
    this.room = undefined;
    this.dmUser = undefined;
  }
  buildPrompt() {
    if (!this.host) return "viny> ";

    if (this.room) return `viny@${this.host.name}#${this.room.name}> `;

    if (this.dmUser) return `viny@${this.host.name}@${this.dmUser.username}> `;

    return `viny@${this.host.name}> `;
  }
}
