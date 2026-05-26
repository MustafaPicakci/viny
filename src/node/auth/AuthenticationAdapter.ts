import type AuthenticationPort from "../../core/auth/AuthenticationPort.js";

import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { IssuedToken, TokenPayload } from "../../core/auth/AuthenticationPort.js";

export interface AuthAdapterOptions {
  jwtSecret: string;
  tokenTtlSeconds?: number;
  bcryptSaltRounds?: number;
}

export default class AuthenticationAdapter implements AuthenticationPort {
  private readonly jwtSecret: string;
  private readonly tokenTtlSeconds: number;
  private readonly bcryptSaltRounds: number;

  constructor(options: AuthAdapterOptions) {
    this.jwtSecret = options.jwtSecret;
    this.tokenTtlSeconds = options.tokenTtlSeconds ?? 60 * 60 * 24;
    this.bcryptSaltRounds = options.bcryptSaltRounds ?? 10;
  }
  async generateToken(payload: TokenPayload): Promise<IssuedToken> {
    const token = await jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenTtlSeconds });
    const expiresAt = new Date(Date.now() + this.tokenTtlSeconds * 1000);
    return { token, expiresAt };
  }
  generatePasswordHash(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptSaltRounds);
  }
  ValidatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  async validateToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (typeof decoded !== "object" || decoded === null) return null;
      const { userId, username } = decoded as Record<string, unknown>;
      if (typeof userId !== "number" || typeof username !== "string") return null;
      return { userId, username };
    } catch {
      return null;
    }
  }
}
