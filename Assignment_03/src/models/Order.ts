import { Cents } from './Product';
import { CartItem } from './ShoppingCart';

export type OrderItem = CartItem & { lineTotalCents: Cents };

export type OrderStatus = 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';

export class Order {
  public readonly orderId: string;
  public readonly customerId: string;
  private _items: OrderItem[];
  private _status: OrderStatus = 'Pending';
  private _createdAt: Date = new Date();
  private _paidAt?: Date;
  private _shippedAt?: Date;
  private _deliveredAt?: Date;

  constructor(orderId: string, customerId: string, items: CartItem[]) {
    if (!orderId || !orderId.trim()) throw new Error('orderId is required');
    if (!customerId || !customerId.trim()) throw new Error('customerId is required');
    if (!Array.isArray(items) || items.length === 0) throw new Error('Order must have at least one item');
    this.orderId = orderId;
    this.customerId = customerId;
    this._items = items.map((i) => ({ ...i, lineTotalCents: i.unitPriceCents * i.quantity }));
  }

  static fromCart(orderId: string, customerId: string, items: CartItem[]): Order {
    return new Order(orderId, customerId, items);
  }

  get items(): OrderItem[] {
    return this._items.map((i) => ({ ...i }));
  }

  get status(): OrderStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get paidAt(): Date | undefined { return this._paidAt; }
  get shippedAt(): Date | undefined { return this._shippedAt; }
  get deliveredAt(): Date | undefined { return this._deliveredAt; }

  get subtotalCents(): Cents {
    return this._items.reduce((s, i) => s + i.lineTotalCents, 0);
  }

  get gstCents(): Cents { return Math.round(this.subtotalCents * 0.10); }
  get totalCents(): Cents { return this.subtotalCents + this.gstCents; }

  markPaid(): void {
    if (this._status === 'Cancelled') throw new Error('Cannot pay a cancelled order');
    this._status = 'Paid';
    this._paidAt = new Date();
  }

  markShipped(): void {
    if (this._status !== 'Paid') throw new Error('Order must be paid before shipping');
    this._status = 'Shipped';
    this._shippedAt = new Date();
  }

  markDelivered(): void {
    if (this._status !== 'Shipped') throw new Error('Order must be shipped before delivery');
    this._status = 'Delivered';
    this._deliveredAt = new Date();
  }

  cancel(): void {
    if (this._status === 'Shipped' || this._status === 'Delivered') throw new Error('Cannot cancel after shipment');
    this._status = 'Cancelled';
  }

  toJSON() {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      paidAt: this._paidAt?.toISOString(),
      shippedAt: this._shippedAt?.toISOString(),
      deliveredAt: this._deliveredAt?.toISOString(),
      items: this.items,
      subtotalCents: this.subtotalCents,
      gstCents: this.gstCents,
      totalCents: this.totalCents
    };
  }
}

export default Order;
