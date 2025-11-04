<template>
  <teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="onClose" role="dialog" aria-modal="true" :aria-label="title">
      <div class="modal" ref="modal" tabindex="-1">
        <button class="close" @click="onClose" aria-label="Close">×</button>
        <div class="header">
          <img v-if="imgSrc" :src="imgSrc" :alt="product?.name || 'Product image'" @error="onImgError"/>
          <div class="title">
            <h2>{{ product?.name }}</h2>
            <div class="subtitle text-muted">ID: {{ product?.productId }}<span v-if="product?.category"> • {{ product.category }}</span></div>
          </div>
        </div>
        <div class="body">
          <p class="description">{{ product?.description }}</p>
          <div class="meta">
            <div><b>Price:</b> ${{ price }}</div>
            <div><b>Stock:</b> {{ product?.quantityAvailable }}</div>
          </div>
        </div>
        <div class="footer">
          <button class="secondary" @click="onClose">Close</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'ProductDetailsModal',
  props: {
    modelValue: { type: Boolean, required: true },
    product: { type: Object, default: null },
    placeholder: { type: String, default: '/images/Supa_Team_4.jpg' }
  },
  emits: ['update:modelValue', 'close'],
  computed: {
    title() { return this.product?.name || 'Product details'; },
    price() {
      const c = Number(this.product?.priceCents || 0);
      return (c / 100).toFixed(2);
    },
    imgSrc() {
      const url = this.product?.imageUrl || '';
      const trimmed = String(url).trim();
      if (!trimmed) return this.placeholder;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (trimmed.startsWith('/')) return trimmed;
      return `/images/${trimmed}`;
    }
  },
  methods: {
    onClose() {
      this.$emit('update:modelValue', false);
      this.$emit('close');
    },
    onKey(e) {
      if (e.key === 'Escape') this.onClose();
    },
    onImgError(e) {
      if (e && e.target) e.target.src = this.placeholder;
    }
  },
  mounted() {
    document.addEventListener('keydown', this.onKey);
    // focus trap basic: focus modal for ESC
    this.$nextTick(() => {
      if (this.$refs.modal) this.$refs.modal.focus();
    });
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKey);
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal {
  background: #fff;
  width: min(720px, 96vw);
  max-height: 90vh;
  overflow: auto;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  position: relative;
  padding: 1rem;
}
.close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #111827;
  font-size: 20px;
  line-height: 1;
}
.header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.header img { width: 96px; height: 96px; object-fit: cover; border-radius: 8px; background:#f6f6f6; }
.title h2 { margin: 0; }
.subtitle { margin-top: 0.125rem; }
.body { padding: 0.5rem 0; }
.description { white-space: pre-wrap; }
.meta { margin-top: 0.5rem; color: #374151; display: flex; gap: 1rem; }
.footer { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.75rem; }
</style>
