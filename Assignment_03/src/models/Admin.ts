import { User, BasicContact } from './User';

/**
 * Admin user type with simple audit helper.
 */
export class Admin extends User {
  private _lastAction?: string;

  constructor(userId: string, contact: BasicContact) {
    super(userId, contact);
  }

  getRole(): 'Admin' {
    return 'Admin';
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
      lastAction: this._lastAction
    };
  }
}