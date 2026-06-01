import DuplicateException from "../../common/exception/DuplicateException.js";
import type { Usecase, UsecaseInput } from "../../common/Usecase.js";
import type User from "../../user/User.js";
import type UserPort from "../../user/UserPort.js";

import type AuthenticationPort from "../AuthenticationPort.js";

export interface RegisterRequest extends UsecaseInput {
  username: string;
  password: string;
}

export default class RegisterUsecase implements Usecase<RegisterRequest, User> {
  constructor(
    private readonly authenticationPort: AuthenticationPort,
    private readonly userPort: UserPort,
  ) {}
  async handle(payload: RegisterRequest): Promise<User> {
    const checkIfAlreadyExists = await this.userPort.findByUsername(payload.username);

    if (checkIfAlreadyExists) {
      throw new DuplicateException("Username already exists");
    }

    const hash = await this.authenticationPort.generatePasswordHash(payload.password);

    return await this.userPort.create({ username: payload.username, password: hash });
  }
}
