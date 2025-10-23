/**
 * User (abstract base class)
 * - Common profile fields and basic validation.
 * - Concrete subclasses: Customer, Admin
 */

export type BasicContact = {
  name: string;
  email: string;
  phone?: string;
};

export abstract class User {
  public readonly userId: string;
  protected _name: string;
  protected _email: string;
  protected _phone?: string;
  protected _createdAt: Date;

  constructor(userId: string, { name, email, phone }: BasicContact) {
    if (!userId || !userId.toString().trim()) throw new Error('userId is required');
    if (!name || !name.trim()) throw new Error('name is required');
    if (!email || !email.trim() || !User.isValidEmail(email)) throw new Error('valid email is required');

    this.userId = userId.toString();
    this._name = name.trim();
    this._email = email.trim().toLowerCase();
    this._phone = phone;
    this._createdAt = new Date();
  }

  // -- abstract role hook --
  abstract getRole(): 'Customer' | 'Admin' | string;

  // -- profile accessors --
  get name(): string {
    return this._name;
  }

  set name(v: string) {
    if (!v || !v.trim()) throw new Error('name cannot be blank');
    this._name = v.trim();
  }

  get email(): string {
    return this._email;
  }

  set email(v: string) {
    if (!v || !v.trim() || !User.isValidEmail(v)) throw new Error('valid email is required');
    this._email = v.trim().toLowerCase();
  }

  get phone(): string | undefined {
    return this._phone;
  }

  set phone(v: string | undefined) {
    this._phone = v;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toJSON() {
    return {
      userId: this.userId,
      name: this._name,
      email: this._email,
      phone: this._phone,
      role: this.getRole(),
      createdAt: this._createdAt.toISOString()
    };
  }

  // Lightweight email validation (sufficient for demo)
  private static isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}