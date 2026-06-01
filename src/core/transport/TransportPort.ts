import type { SendMessageResponse } from "../message/usecase/SendMessageUsecase.js";

export default interface TransportPort {
  transport(message: SendMessageResponse, recipients: number[]): Promise<void>;
}
