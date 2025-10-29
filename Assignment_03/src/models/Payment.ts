import { Cents } from './Product';

export type PaymentMethod = 'Card' | 'PayPal' | 'Cash' | 'BankTransfer';
export type PaymentStatus = 'Initiated' | 'Completed' | 'Failed' | 'Refunded';

export class Payment {
  public readonly paymentId: string;
  public readonly orderId: string;
  public readonly method: PaymentMethod;
  public readonly amountCents: Cents;
  private _status: PaymentStatus = 'Initiated';
  private _processedAt?: Date;

  constructor(paymentId: string, orderId: string, method: PaymentMethod, amountCents: Cents) {
    if (!paymentId || !paymentId.trim()) throw new Error('paymentId is required');
    if (!orderId || !orderId.trim()) throw new Error('orderId is required');
    if (!Number.isInteger(amountCents) || amountCents < 0) throw new Error('amountCents must be integer >= 0');
    this.paymentId = paymentId;
    this.orderId = orderId;
    this.method = method;
    this.amountCents = amountCents;
  }

  get status(): PaymentStatus { return this._status; }
  get processedAt(): Date | undefined { return this._processedAt; }

  complete(): void {
    this._status = 'Completed';
    this._processedAt = new Date();
  }

  fail(): void {
    this._status = 'Failed';
    this._processedAt = new Date();
  }

  refund(): void {
    if (this._status !== 'Completed') throw new Error('Only completed payments can be refunded');
    this._status = 'Refunded';
    this._processedAt = new Date();
  }

  toJSON() {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      method: this.method,
      amountCents: this.amountCents,
      status: this._status,
      processedAt: this._processedAt?.toISOString()
    };
  }
}

export default Payment;
