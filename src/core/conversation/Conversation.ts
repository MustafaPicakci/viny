export default class Conversation {
  constructor(
    public id: number,
    public type: "GROUP" | "DM",
    public participants: number[],
    public name?: string,
  ) {}
}
