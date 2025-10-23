export type Cents = number;

export type ProductOptions = {
  description?: string;
  category?: string;
  imageUrl?: string;
};

/** To add possibly:
 *   Explicit checkAvailability(requested: number): boolean (non-throwing check).
 *   calculateGST(): number — a single method returning GST in cents (if other code needs GST separately).
 *   updatePrice(newPriceCents): void — wrapper method that records price changes to a price history list (if required).
 *   Add Category enum or controlled vocabulary if categories must be validated against a set.
 *   Unit tests for getDetails(), calculateGST(), checkAvailability, and imageUrl validation (the tests I supplied earlier already cover many cases, add more as needed).
 */

/**
 * Product domain class.
 * - price stored as integer cents to avoid floating-point issues.
 * - productId is the unique identifier for equality.
 *
 * Basic invariants:
 * - productId and name must be non-empty
 * - priceCents >= 0
 * - quantityAvailable >= 0
 */
export class Product {
  public readonly productId: string;
  private _name: string;
  private _priceCents: Cents;
  private _quantityAvailable: number;

  // optional fields from CRC card
  private _description?: string;
  private _category?: string;
  private _imageUrl?: string;

  constructor(
    productId: string,
    name: string,
    priceCents: Cents,
    quantityAvailable: number,
    opts?: ProductOptions
  ) {
    if (!productId || productId.trim() === '') throw new Error('Product id is required');
    if (!name || name.trim() === '') throw new Error('Product name is required');
    if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error('priceCents must be an integer >= 0');
    if (!Number.isInteger(quantityAvailable) || quantityAvailable < 0)
      throw new Error('quantityAvailable must be an integer >= 0');

    this.productId = productId;
    this._name = name;
    this._priceCents = priceCents;
    this._quantityAvailable = quantityAvailable;

    if (opts?.description !== undefined) this.description = opts.description;
    if (opts?.category !== undefined) this.category = opts.category;
    if (opts?.imageUrl !== undefined) this.imageUrl = opts.imageUrl;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    if (!value || value.trim() === '') throw new Error('Product name cannot be blank');
    this._name = value;
  }

  get priceCents(): Cents {
    return this._priceCents;
  }

  /**
   * Replace unit price (in cents). Must be integer >= 0
   */
  set priceCents(value: Cents) {
    if (!Number.isInteger(value) || value < 0) throw new Error('priceCents must be an integer >= 0');
    this._priceCents = value;
  }

  /**
   * Get available quantity and check if > 0 with isAvailable()
   */
  get quantityAvailable(): number {
    return this._quantityAvailable;
  }

  isAvailable(): boolean {
    return this._quantityAvailable > 0;
  }

  /**
   * Reduce the available quantity by amount (integer > 0).
   * Throws if amount invalid or insufficient stock.
   */
  reduceStock(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('amount must be an integer > 0');
    if (amount > this._quantityAvailable) throw new Error('insufficient stock');
    this._quantityAvailable -= amount;
  }

  /**
   * Increase the available quantity by amount (integer > 0).
   */
  increaseStock(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('amount must be an integer > 0');
    this._quantityAvailable += amount;
  }

  // --- CRC optional fields: description, category, imageUrl ---

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    if (value !== undefined && value.trim() === '') throw new Error('description cannot be blank');
    this._description = value;
  }

  get category(): string | undefined {
    return this._category;
  }

  set category(value: string | undefined) {
    if (value !== undefined && value.trim() === '') throw new Error('category cannot be blank');
    this._category = value;
  }

  get imageUrl(): string | undefined {
    return this._imageUrl;
  }

  set imageUrl(value: string | undefined) {
    if (value === undefined) {
      this._imageUrl = undefined;
      return;
    }
    // Light validation: use URL constructor to check format
    try {
      // allow relative URLs? If you want to require absolute URLs, keep as-is.
      // For this assignment we require a valid absolute/relative URL parseable by URL.
      // For Node environments, new URL(value) requires a base for relative URLs; to support relative,
      // attempt absolute first, otherwise accept strings that start with '/'.
      // Here we'll accept absolute URLs and paths starting with '/'.
      if (value.startsWith('/')) {
        this._imageUrl = value;
        return;
      }
      // throws if invalid absolute URL
      // eslint-disable-next-line no-new
      new URL(value);
      this._imageUrl = value;
    } catch {
      throw new Error('imageUrl must be a valid URL or a path starting with "/"');
    }
  }

  // Convenience: return category (matches CRC's getCategory())
  getCategory(): string | undefined {
    return this._category;
  }

  /**
   * Return a plain object suitable for JSON serialization or DTOs.
   */
  toJSON() {
    return {
      productId: this.productId,
      name: this._name,
      description: this._description,
      category: this._category,
      imageUrl: this._imageUrl,
      priceCents: this._priceCents,
      quantityAvailable: this._quantityAvailable
    };
  }

  /**
   * Richer domain DTO. Includes computed availability and formatted price.
   */
  getDetails() {
    return {
      ...this.toJSON(),
      isAvailable: this.isAvailable(),
      priceFormatted: (this._priceCents / 100).toFixed(2),
      gstCents: Math.round(this._priceCents * 0.10)
    };
  }

  /**
   * Equality by id (domain identity).
   */
  equals(other: Product): boolean {
    return other != null && this.productId === other.productId;
  }
}