export class AlreadyExistsError extends Error {
  constructor(message: string = "Folder already exists") {
    super(message);
    this.name = "AlreadyExistsError";
  }
}
