import { Product, Cents } from './Product';

export type CartItem = {
  productId: string;
  name: string;
  unitPriceCents: Cents; // snapshot price at time of adding
  quantity: number; // integer > 0
};

/**
 * ShoppingCart
 * - lightweight in-memory cart for a customer
 * - stores line items and computes totals (subtotal, GST, total)
 */
export class ShoppingCart {
  public readonly cartId: string;
  private items: Map<string, CartItem> = new Map(); // key = productId
  private _createdAt: Date = new Date();

  constructor(cartId: string) {
    if (!cartId || !cartId.toString().trim()) throw new Error('cartId is required');
    this.cartId = cartId.toString();
  }

  // --- functions ---------------------------------------------------------

  addProduct(product: Product, quantity = 1): void {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('quantity must be integer > 0');
    const existing = this.items.get(product.productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.set(product.productId, {
        productId: product.productId,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity
      });
    }
  }

  updateQuantity(productId: string, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error('quantity must be integer >= 0');
    const line = this.items.get(productId);
    if (!line) throw new Error('product not in cart');
    if (quantity === 0) {
      this.items.delete(productId);
    } else {
      line.quantity = quantity;
    }
  }

  removeProduct(productId: string): void {
    this.items.delete(productId);
  }

  clear(): void {
    this.items.clear();
  }

  // --- queries -----------------------------------------------------------

  getItems(): CartItem[] {
    return Array.from(this.items.values()).map((i) => ({ ...i }));
  }

  getSubtotalCents(): Cents {
    let sum = 0;
    this.items.forEach((i) => {
      sum += i.unitPriceCents * i.quantity;
    });
    return sum;
  }

  getGstCents(): Cents {
    // GST = 10% of subtotal (rounded to nearest cent)
    return Math.round(this.getSubtotalCents() * 0.10);
  }

  getTotalCents(): Cents {
    return this.getSubtotalCents() + this.getGstCents();
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toJSON() {
    return {
      cartId: this.cartId,
      createdAt: this._createdAt.toISOString(),
      items: this.getItems(),
      subtotalCents: this.getSubtotalCents(),
      gstCents: this.getGstCents(),
      totalCents: this.getTotalCents()
    };
  }
}

export default ShoppingCart;
