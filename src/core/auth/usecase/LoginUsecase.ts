import DuplicateException from "../../common/exception/DuplicateException.js";
import NotFoundException from "../../common/exception/NotFoundException.js";
import type { Usecase, UsecaseInput } from "../../common/Usecase.js";
import type UserPort from "../../user/UserPort.js";

import type AuthenticationPort from "../AuthenticationPort.js";

const expiresIn = 60 * 60 * 24; // 24 hour TODO Bunu envden al!

export interface LoginRequest extends UsecaseInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  token: string;
  expiresAt: Date;
}

export default class LoginUsecase implements Usecase<LoginRequest, LoginResponse> {
  constructor(
    private readonly authenticationPort: AuthenticationPort,
    private readonly userPort: UserPort,
  ) {}
  async handle(payload: LoginRequest): Promise<LoginResponse> {
    const user = await this.userPort.findByUsername(payload.username);

    if (!user) {
      throw new NotFoundException("Invalid username or password");
    }

    const isMatch = await this.authenticationPort.ValidatePassword(payload.password, user.password);

    if (!isMatch) {
      throw new DuplicateException("Invalid username or password");
    }

    const issuedToken = await this.authenticationPort.generateToken({ userId: user.id, username: user.username });

    return {
      username: user.username,
      ...issuedToken,
    };
  }
}
