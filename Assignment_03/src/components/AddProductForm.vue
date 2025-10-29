<template>
  <section class="add-product">
    <h2>Add Product</h2>
    <form @submit.prevent="submit">
      <div class="row">
        <input v-model="form.productId" placeholder="productId (SKU)" required />
        <input v-model="form.name" placeholder="Name" required />
        <input v-model.number="form.price" type="number" step="0.01" placeholder="Price (AUD)" required />
        <input v-model.number="form.quantity" type="number" min="0" placeholder="Quantity" required />
      </div>
      <div class="row">
        <input v-model="form.category" placeholder="Category (optional)" />
        <input v-model="form.imageUrl" placeholder="Image URL or filename (optional)" />
      </div>
      <div class="row">
        <textarea v-model="form.description" placeholder="Description (optional)"></textarea>
      </div>
      <div class="row">
        <button type="submit">Add Product</button>
        <button type="button" @click="resetForm">Reset</button>
      </div>
    </form>
  </section>
</template>

<script>
export default {
  name: 'AddProductForm',
  data() {
    return {
      form: {
        productId: '',
        name: '',
        price: 0.0,
        quantity: 0,
        category: '',
        imageUrl: '',
        description: ''
      }
    };
  },
  methods: {
    submit() {
      const dto = {
        productId: this.form.productId,
        name: this.form.name,
        price: this.form.price,
        inventory_count: this.form.quantity,
        category: this.form.category || undefined,
        imageUrl: this.form.imageUrl || undefined,
        description: this.form.description || undefined
      };
      this.$emit('add', dto);
    },
    resetForm() {
      this.form = { productId: '', name: '', price: 0.0, quantity: 0, category: '', imageUrl: '', description: '' };
      this.$emit('reset');
    }
  }
};
</script>

<style scoped>
.add-product { margin-bottom: 1rem; padding: 0.6rem; background: #fafafa; border-radius: 6px; }
.row { display:flex; gap:0.5rem; margin-bottom:0.5rem; }
.row input, .row textarea { flex:1; padding:0.4rem; }
</style>
