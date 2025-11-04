// Centralised cart store using the ShoppingCart domain class.
// No changes to .ts classes; we just import and use them.

import { reactive, computed } from 'vue';
import ShoppingCart from '../models/ShoppingCart';
import { Product } from '../models/Product';

const cart = new ShoppingCart('main-cart');
const STORAGE_KEY = 'yls_cart_v1';

const state = reactive({
  items: cart.getItems(),
});

function sync() {
  state.items = cart.getItems();
  // persist to localStorage (browser only)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: state.items })
      );
    } catch (_) { /* ignore quota errors */ }
  }
}

// Rehydrate from localStorage
function loadFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    for (const i of items) {
      // Construct a Product using the snapshot unit price and a generous stock placeholder.
      const p = new Product(i.productId, i.name, i.unitPriceCents, Number.MAX_SAFE_INTEGER);
      cart.addProduct(p, i.quantity);
    }
    state.items = cart.getItems();
  } catch (_) { /* ignore parse or rehydrate errors */ }
}
loadFromStorage();

function findItem(productId) {
  return state.items.find((i) => i.productId === productId);
}

export default {
  // queries
  items: computed(() => state.items),
  itemCount: computed(() => state.items.reduce((sum, i) => sum + i.quantity, 0)),
  // Make totals reactive by depending on state.items (reactive) but delegating math to the domain cart.
  subtotalCents: computed(() => { void state.items; return cart.getSubtotalCents(); }),
  gstCents: computed(() => { void state.items; return cart.getGstCents(); }),
  totalCents: computed(() => { void state.items; return cart.getTotalCents(); }),

  // commands
  addProduct(product, quantity = 1) {
    const qty = Math.max(1, Math.floor(quantity));
    const existing = findItem(product.productId);
    const desired = (existing ? existing.quantity : 0) + qty;
    const max = product.quantityAvailable;
    if (desired > max) {
      // clamp to max; if nothing can be added, throw to signal UI
      const canAdd = Math.max(0, max - (existing ? existing.quantity : 0));
      if (canAdd <= 0) throw new Error('Requested quantity exceeds available stock');
      cart.addProduct(product, canAdd);
    } else {
      cart.addProduct(product, qty);
    }
    sync();
  },

  updateQuantity(productId, quantity, maxStock) {
    const qty = Math.max(0, Math.floor(quantity));
    const max = Number.isFinite(maxStock) ? Math.max(0, Math.floor(maxStock)) : undefined;
    const finalQty = max !== undefined ? Math.min(qty, max) : qty;
    cart.updateQuantity(productId, finalQty);
    sync();
  },

  removeProduct(productId) {
    cart.removeProduct(productId);
    sync();
  },

  clear() {
    cart.clear();
    sync();
  },
};
