export class AppError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400, 'validation_error'); }
}
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') { super(message, 401, 'authentication_error'); }
}
export class AuthorizationError extends AppError {
  constructor(message = 'Not allowed') { super(message, 403, 'authorization_error'); }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404, 'not_found'); }
}
export class ExternalProviderError extends AppError {
  constructor(message = 'Food data provider unavailable') { super(message, 503, 'provider_unavailable'); }
}
export class DatabaseError extends AppError {
  constructor(message = 'Database error') { super(message, 500, 'database_error'); }
}
