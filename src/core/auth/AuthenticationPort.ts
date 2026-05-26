export type TokenPayload = {
  userId: number;
  username: string;
};

export type IssuedToken = {
  token: string;
  expiresAt: Date;
};
export default interface AuthenticationPort {
  generateToken(payload: TokenPayload): Promise<IssuedToken>;
  generatePasswordHash(password: string): Promise<string>;
  ValidatePassword(password: string, hash: string): Promise<boolean>;
  validateToken(token: string): Promise<{ userId: number } | null>;
}
