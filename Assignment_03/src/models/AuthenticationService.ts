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
    // attempt to restore persisted state (users + sessions) so sessions survive page reloads
    try { this.loadState(); } catch { /* ignore load errors and continue with fresh state */ }
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
    // persist updated users
    try { this.saveState(); } catch { }
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
    // persist new session so it survives reloads
    try { this.saveState(); } catch { }
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
  // persist updated expiry
  try { this.saveState(); } catch { }
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
    try { this.saveState(); } catch { }
  }

  // Change password for a user (requires old password)
  changePassword(userId: string, oldPassword: string, newPassword: string): void {
    const rec = this.usersById.get(userId);
    if (!rec) throw new Error('User not found');
    if (rec.passwordHash !== this.hashPassword(oldPassword)) throw new InvalidCredentialsError('Current password incorrect');
    rec.passwordHash = this.hashPassword(newPassword);
    try { this.saveState(); } catch { }
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

  // Persist minimal state (users and sessions) to localStorage so sessions survive reloads.
  // This is just a demo convenience
  private saveKey = 'auth_state_v1';

  private saveState() {
    try {
      const users: Record<string, any> = {};
      this.usersById.forEach(({ user, passwordHash }, id) => {
        users[id] = { user: (user as any).toJSON ? (user as any).toJSON() : { userId: user.userId }, passwordHash };
      });
      const sessionsObj: Record<string, SessionRecord> = {};
      this.sessions.forEach((rec, token) => {
        sessionsObj[token] = { userId: rec.userId, expiresAt: rec.expiresAt };
      });
      const payload = {
        users,
        usersByEmail: Array.from(this.usersByEmail.entries()),
        sessions: sessionsObj
      };
      localStorage.setItem(this.saveKey, JSON.stringify(payload));
    } catch (e) {
      // ignore persistence errors for demo
      // eslint-disable-next-line no-console
      console.warn('Failed to save auth state', e);
    }
  }

  private loadState() {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      // restore users
      const users = parsed.users || {};
      for (const userId of Object.keys(users)) {
        const rec = users[userId];
        const ujson = rec.user || {};
        const role = ujson.role || 'Customer';
        let user: User;
        if (role === 'Admin') {
          // Admin expects (userId, contact, initialPermissions)
          user = new Admin(userId, { name: ujson.name || 'Admin', email: ujson.email || '' , phone: ujson.phone }, ujson.permissions || []);
          // restore lastAction if present
          if (ujson.lastAction && (user as Admin).recordAction) {
            try { (user as Admin).recordAction(ujson.lastAction); } catch { }
          }
        } else {
          user = new Customer(userId, { name: ujson.name || 'Customer', email: ujson.email || '' , phone: ujson.phone }, { deliveryAddress: ujson.deliveryAddress, cartId: ujson.cartId });
        }
        const pwHash = rec.passwordHash || '';
        this.usersById.set(userId, { user, passwordHash: pwHash });
      }

      // restore usersByEmail
      if (Array.isArray(parsed.usersByEmail)) {
        for (const [email, id] of parsed.usersByEmail) {
          this.usersByEmail.set(email, id);
        }
      }

      // restore sessions
      const sessionsObj = parsed.sessions || {};
      for (const token of Object.keys(sessionsObj)) {
        const rec = sessionsObj[token];
        // only restore sessions that haven't expired yet
        if (rec && rec.expiresAt && rec.expiresAt > Date.now()) {
          this.sessions.set(token, { userId: rec.userId, expiresAt: rec.expiresAt });
        }
      }
    } catch (e) {
      // if parsing fails, ignore and start fresh
      // eslint-disable-next-line no-console
      console.warn('Failed to load auth state', e);
    }
  }
}

// default export for convenience
export default AuthenticationService.getInstance();