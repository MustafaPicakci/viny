export default interface TransportPort {
  transport(message: string, recipients: number[]): Promise<void>;
}
