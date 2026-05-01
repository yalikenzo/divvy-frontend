export class RegisterPayload {
  constructor(email, password, firstName, lastName) {
    this.email = email;
    this.password = password;
    this.first_name = firstName;
    this.last_name = lastName;
  }
}

export class LoginPayload {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}

export class TokenPair {
  constructor(accessToken, refreshToken, tokenType = 'bearer') {
    this.access_token = accessToken;
    this.refresh_token = refreshToken;
    this.token_type = tokenType;
  }
}

export class User {
  constructor(
    sub,
    email,
    firstName,
    lastName,
    isVerified,
    isActive,
    exp,
    type = 'access'
  ) {
    this.sub = sub;
    this.email = email;
    this.first_name = firstName;
    this.last_name = lastName;
    this.is_verified = isVerified;
    this.is_active = isActive;
    this.exp = exp;
    this.type = type;
  }

  static fromJWTPayload(payload) {
    return new User(
      payload.sub,
      payload.email,
      payload.first_name,
      payload.last_name,
      payload.is_verified,
      payload.is_active,
      payload.exp,
      payload.type
    );
  }

  isTokenExpired() {
    return Date.now() >= this.exp * 1000;
  }

  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim();
  }
}

export class ApiError {
  constructor(message, status, errors = null) {
    this.message = message;
    this.status = status;
    this.errors = errors;
  }
}
