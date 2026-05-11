/** Thrown for invalid user input — shown directly in the UI. */
export class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserError';
  }
}
