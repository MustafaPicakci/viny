export default class Message {
  constructor(
    public id: number,
    public conversationId: number,
    public senderId: number,
    public text: string,
    public timestamp: Date,
  ) {}
}
