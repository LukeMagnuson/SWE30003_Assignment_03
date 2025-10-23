import { User, BasicContact } from './User';

/**
 * Customer user type with lightweight fields from CRC:
 * - deliveryAddress, orderHistory, cartId (optional)
 */
export class Customer extends User {
  private _deliveryAddress?: string;
  private _cartId?: string;
  private _orderHistory: string[] = []; // store order IDs or snapshots as strings

  constructor(userId: string, contact: BasicContact, opts?: { deliveryAddress?: string; cartId?: string }) {
    super(userId, contact);
    if (opts?.deliveryAddress) this._deliveryAddress = opts.deliveryAddress;
    if (opts?.cartId) this._cartId = opts.cartId;
  }

  getRole(): 'Customer' {
    return 'Customer';
  }

  get deliveryAddress(): string | undefined {
    return this._deliveryAddress;
  }

  set deliveryAddress(addr: string | undefined) {
    this._deliveryAddress = addr;
  }

  get cartId(): string | undefined {
    return this._cartId;
  }

  set cartId(id: string | undefined) {
    this._cartId = id;
  }

  addToOrderHistory(orderIdOrSnapshot: string) {
    this._orderHistory.push(orderIdOrSnapshot);
  }

  getOrderHistory(): string[] {
    // return a shallow copy to preserve encapsulation
    return [...this._orderHistory];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      deliveryAddress: this._deliveryAddress,
      cartId: this._cartId,
      orderHistoryCount: this._orderHistory.length
    };
  }
}