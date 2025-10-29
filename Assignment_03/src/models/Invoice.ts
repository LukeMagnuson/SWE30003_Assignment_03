import { Cents } from './Product';
import Order, { OrderItem } from './Order';

export type InvoiceLine = OrderItem & { lineGstCents: Cents };

export class Invoice {
  public readonly invoiceId: string;
  public readonly orderId: string;
  public readonly billingName: string;
  public readonly billingAddress?: string;
  private _lines: InvoiceLine[];
  private _issuedAt: Date = new Date();

  constructor(invoiceId: string, order: Order, billingName: string, billingAddress?: string) {
    if (!invoiceId || !invoiceId.trim()) throw new Error('invoiceId is required');
    if (!billingName || !billingName.trim()) throw new Error('billingName is required');
    this.invoiceId = invoiceId;
    this.orderId = order.orderId;
    this.billingName = billingName.trim();
    this.billingAddress = billingAddress;
    this._lines = order.items.map((i) => ({ ...i, lineGstCents: Math.round(i.lineTotalCents * 0.10) }));
  }

  get lines(): InvoiceLine[] { return this._lines.map((l) => ({ ...l })); }
  get issuedAt(): Date { return this._issuedAt; }

  get subtotalCents(): Cents { return this._lines.reduce((s, l) => s + l.lineTotalCents, 0); }
  get gstCents(): Cents { return this._lines.reduce((s, l) => s + l.lineGstCents, 0); }
  get totalCents(): Cents { return this.subtotalCents + this.gstCents; }

  toJSON() {
    return {
      invoiceId: this.invoiceId,
      orderId: this.orderId,
      billingName: this.billingName,
      billingAddress: this.billingAddress,
      issuedAt: this._issuedAt.toISOString(),
      lines: this.lines,
      subtotalCents: this.subtotalCents,
      gstCents: this.gstCents,
      totalCents: this.totalCents
    };
  }
}

export default Invoice;
