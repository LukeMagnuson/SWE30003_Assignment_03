/**
 * AuthenticationService (singleton)
 * - simple in-memory user store (for demo)
 * - factory method for creating Customer or Admin
 * - session token management with expiry
 *
 * NOTE: This is a demo implementation intended for development / assignment use only.
 * Do NOT use this for production authentication.
 */

import { User } from './User';
import { Customer } from './Customer';
import { Admin } from './Admin';

export class InvalidCredentialsError extends Error {}
export class UnauthorisedAccessError extends Error {}
export class SessionExpiredError extends Error {}
export class UserExistsError extends Error {}

export type SessionRecord = {
  userId: string;
  expiresAt: number; // epoch ms
};

export class AuthenticationService {
  private static _instance: AuthenticationService | null = null;

  // simple in-memory stores
  private usersById: Map<string, { user: User; passwordHash: string }> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId
  private sessions: Map<string, SessionRecord> = new Map();

  // session TTL (ms). matches design = 30 minutes of inactivity
  private sessionTTLms = 30 * 60 * 1000;

  private constructor() {
    // private for singleton
  }

  static getInstance(): AuthenticationService {
    if (!this._instance) this._instance = new AuthenticationService();
    return this._instance;
  }

  // Simple (non-cryptographic) hash for demo purposes only.
  private hashPassword(password: string): string {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < password.length; i++) {
      h ^= password.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  // Factory method for registration (creates Customer or Admin)
  registerUser(type: 'customer' | 'admin', userId: string, name: string, email: string, password: string, opts?: any): User {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.usersByEmail.has(normalizedEmail)) throw new UserExistsError('Email already registered');

    let user: User;
    if (type === 'admin') {
      const admin = new Admin(userId, { name, email, phone: opts?.phone }, opts?.permissions);
      user = admin;
    } else {
      const customer = new Customer(userId, { name, email, phone: opts?.phone }, { deliveryAddress: opts?.deliveryAddress });
      user = customer;
    }

    const pwHash = this.hashPassword(password);
    this.usersById.set(user.userId, { user, passwordHash: pwHash });
    this.usersByEmail.set(normalizedEmail, user.userId);
    return user;
  }

  // Authenticate using email + password. Returns a session token.
  login(email: string, password: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.usersByEmail.get(normalizedEmail);
    if (!userId) throw new InvalidCredentialsError('Invalid email or password');

    const record = this.usersById.get(userId)!;
    const pwHash = this.hashPassword(password);
    if (record.passwordHash !== pwHash) throw new InvalidCredentialsError('Invalid email or password');

    // create token (simple random string)
    const token = this.createToken();
    const expiresAt = Date.now() + this.sessionTTLms;
    this.sessions.set(token, { userId: record.user.userId, expiresAt });
    return token;
  }

  // Validate token and return user
  validateSession(token: string): User {
    const rec = this.sessions.get(token);
    if (!rec) throw new SessionExpiredError('Invalid or expired session');
    if (Date.now() > rec.expiresAt) {
      this.sessions.delete(token);
      throw new SessionExpiredError('Session expired');
    }
    // sliding expiration: extend the session
    rec.expiresAt = Date.now() + this.sessionTTLms;
    const userRecord = this.usersById.get(rec.userId);
    if (!userRecord) {
      this.sessions.delete(token);
      throw new SessionExpiredError('User not found for session');
    }
    return userRecord.user;
  }

  // Invalidate a session token
  logout(token: string): void {
    this.sessions.delete(token);
  }

  // Change password for a user (requires old password)
  changePassword(userId: string, oldPassword: string, newPassword: string): void {
    const rec = this.usersById.get(userId);
    if (!rec) throw new Error('User not found');
    if (rec.passwordHash !== this.hashPassword(oldPassword)) throw new InvalidCredentialsError('Current password incorrect');
    rec.passwordHash = this.hashPassword(newPassword);
  }

  // permission check: returns true if user has permission
  checkPermission(userId: string, permission: string): boolean {
    const rec = this.usersById.get(userId);
    if (!rec) return false;
    const user = rec.user;
    if (user instanceof Admin) return user.hasPermission(permission);
    // customers have no admin permissions by default
    return false;
  }

  // Retrieve user by id
  getUserById(userId: string): User | undefined {
    return this.usersById.get(userId)?.user;
  }

  // Simple utility to create random token
  private createToken(): string {
    // quick non-crypto token for demo
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // For demo/testing: seed an admin and a customer if none exist
  seedIfEmpty() {
    if (this.usersById.size === 0) {
      const admin = this.registerUser('admin', 'admin-1', 'Store Admin', 'admin@store.test', 'adminpass', {
        permissions: ['catalog:write', 'orders:manage', 'reports:view']
      });
      const cust = this.registerUser('customer', 'cust-1', 'Demo Customer', 'customer@store.test', 'custpass', {
        deliveryAddress: '123 Demo St'
      });
      // no session created automatically
      // eslint-disable-next-line no-console
      console.info('AuthenticationService seeded demo users:', admin.userId, cust.userId);
    }
  }
}

// default export for convenience
export default AuthenticationService.getInstance();