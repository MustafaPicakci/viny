export interface UsecaseInput {}
export interface AuthenticatedUsecaseInput extends UsecaseInput {
  requestedBy: number;
}

export interface Usecase<input, output> {
  handle(payload: input): Promise<output>;
}

export interface AuthenticatedUsecase<AuthenticatedUsecaseInput, output> extends Usecase<AuthenticatedUsecaseInput, output> {}
