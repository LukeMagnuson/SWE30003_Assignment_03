/**
 * ProductCatalogue - in-memory catalogue of Product domain objects.
 *
 * Place this file at: Assignment_03/src/models/product-catalogue.ts
 *
 * This implementation expects you to have the updated Product class in:
 *  Assignment_03/src/models/product.ts
 *
 * Responsibilities (per CRC):
 *  - store and retrieve products
 *  - search / filter by category, keyword, price range
 *  - check and update stock levels
 *  - identify low-stock products
 */

import { Product, Cents } from './Product';

export type ProductDTO = {
  // accept many common JSON shapes (flexible mapping)
  id?: string;
  sku?: string;
  productId?: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  priceCents?: number;
  price?: number; // dollars
  inventory_count?: number;
  quantityAvailable?: number;
  stock?: number;
  [k: string]: any;
};

export class ProductCatalogue {
  private products: Map<string, Product>;

  constructor(initialProducts?: Product[]) {
    this.products = new Map<string, Product>();
    (initialProducts || []).forEach((p) => this.products.set(p.productId, p));
  }

  // --- creation / loading helpers ----------------------------------------

  /**
   * Create a Product instance from a flexible DTO.
   * Maps common keys used in sample JSON files to Product constructor parameters.
   */
  static productFromDTO(dto: ProductDTO): Product {
    const id = dto.productId ?? dto.id ?? dto.sku ?? (() => {
      // fallback: try to stringify any numeric id-like field
      return undefined;
    })();

    if (!id) throw new Error('DTO missing product id');

    const name = dto.name ?? dto.title ?? 'Unnamed product';

    // price handling: accept cents or dollars
    let priceCents: Cents = 0;
    if (typeof dto.priceCents === 'number') {
      priceCents = Math.round(dto.priceCents);
    } else if (typeof dto.price === 'number') {
      priceCents = Math.round(dto.price * 100);
    }

    // quantity mapping: try many common keys
    const quantityAvailable =
      typeof dto.quantityAvailable === 'number'
        ? Math.round(dto.quantityAvailable)
        : typeof dto.inventory_count === 'number'
        ? Math.round(dto.inventory_count)
        : typeof dto.stock === 'number'
        ? Math.round(dto.stock)
        : 0;

    const opts = {
      description: dto.description,
      category: dto.category,
      imageUrl: dto.imageUrl,
    };

    return new Product(id, name, priceCents, quantityAvailable, opts);
  }

  /**
   * Load product data from a URL (relative path or absolute).
   * Accepts either an array of DTOs or an object with items: DTO[].
   */
  static async loadFromUrl(url: string): Promise<ProductCatalogue> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch product data from ${url}: ${res.status} ${res.statusText}`);
    const json = await res.json();
    const dtos: ProductDTO[] = Array.isArray(json) ? json : json.items ?? [];
    const products = dtos.map((d) => ProductCatalogue.productFromDTO(d));
    return new ProductCatalogue(products);
  }

  // --- CRUD / queries -----------------------------------------------------

  addProduct(product: Product): void {
    if (this.products.has(product.productId)) {
      throw new Error(`Product ${product.productId} already exists`);
    }
    this.products.set(product.productId, product);
  }

  updateProduct(product: Product): void {
    if (!this.products.has(product.productId)) {
      throw new Error(`Product ${product.productId} does not exist`);
    }
    this.products.set(product.productId, product);
  }

  removeProduct(productId: string): boolean {
    return this.products.delete(productId);
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductById(productId: string): Product | undefined {
    return this.products.get(productId);
  }

  searchProducts(keyword: string): Product[] {
    const k = (keyword || '').toLowerCase().trim();
    if (!k) return this.getAllProducts();
    return this.getAllProducts().filter((p) => {
      const name = p.name?.toLowerCase() ?? '';
      const desc = (p.description ?? '').toLowerCase();
      return name.includes(k) || desc.includes(k);
    });
  }

  filterByCategory(category: string): Product[] {
    const c = (category || '').toLowerCase().trim();
    if (!c) return this.getAllProducts();
    return this.getAllProducts().filter((p) => (p.getCategory() ?? '').toLowerCase() === c);
  }

  getProductsByPriceRange(minCents: number, maxCents: number): Product[] {
    return this.getAllProducts().filter((p) => p.priceCents >= minCents && p.priceCents <= maxCents);
  }

  // --- stock operations ---------------------------------------------------

  checkStockLevel(productId: string): number {
    const p = this.getProductById(productId);
    if (!p) throw new Error(`Product ${productId} not found`);
    return p.quantityAvailable;
  }

  reduceStock(productId: string, amount: number): void {
    const p = this.getProductById(productId);
    if (!p) throw new Error(`Product ${productId} not found`);
    p.reduceStock(amount);
  }

  increaseStock(productId: string, amount: number): void {
    const p = this.getProductById(productId);
    if (!p) throw new Error(`Product ${productId} not found`);
    p.increaseStock(amount);
  }

  getLowStockProducts(threshold = 5): Product[] {
    return this.getAllProducts().filter((p) => p.quantityAvailable <= threshold);
  }

  // --- serialization -------------------------------------------------------

  toJSON() {
    return this.getAllProducts().map((p) => p.toJSON());
  }
}

export default ProductCatalogue;