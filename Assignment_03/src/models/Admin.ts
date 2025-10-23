import { User, BasicContact } from './User';

/**
 * Admin user type with permissions list and simple audit helper.
 * - permissions are strings (e.g., 'catalog:write', 'orders:manage', 'reports:view')
 */
export class Admin extends User {
  private _permissions: Set<string> = new Set<string>();
  private _lastAction?: string;

  constructor(userId: string, contact: BasicContact, initialPermissions?: string[]) {
    super(userId, contact);
    (initialPermissions || []).forEach((p) => this._permissions.add(p));
  }

  getRole(): 'Admin' {
    return 'Admin';
  }

  hasPermission(permission: string): boolean {
    return this._permissions.has(permission);
  }

  grantPermission(permission: string) {
    this._permissions.add(permission);
  }

  revokePermission(permission: string) {
    this._permissions.delete(permission);
  }

  recordAction(action: string) {
    this._lastAction = `${new Date().toISOString()} ${action}`;
  }

  get lastAction(): string | undefined {
    return this._lastAction;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      permissions: Array.from(this._permissions),
      lastAction: this._lastAction
    };
  }
}