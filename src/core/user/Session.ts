export default interface Session {
  userId: number;
  username: string;
  token: string;
  expiresAt: Date;
}
