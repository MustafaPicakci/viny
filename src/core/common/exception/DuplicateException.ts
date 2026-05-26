export default class DuplicateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateException";
  }
}
