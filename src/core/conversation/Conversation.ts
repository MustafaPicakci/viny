export default class Conversation {
  constructor(
    public id: number,
    public participants: number[],
    public name?: string,
  ) {}
}
