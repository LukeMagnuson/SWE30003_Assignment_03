<template>
  <div class="test-container">
    <!-- 🧠 Data binding example -->
    <h1>{{ message }}</h1>

    <!-- ⚙️ Computed property example -->
    <p>Reversed: {{ reversedMessage }}</p>

    <!-- 🧮 Reactive number example -->
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <button @click="reset">Reset</button>

    <!-- 🧰 Error example -->
    <div v-if="error" class="error">{{ error }}</div>

    <!-- 🗂️ List rendering example -->
    <ul>
      <li v-for="(item, index) in items" :key="index">{{ item }}</li>
    </ul>

    <!-- 🧩 Form input example -->
    <input v-model="message" placeholder="Type a message..." />
  </div>
</template>

<script>
// -----------------------------------------------------------
// ✅ Test.vue - A self-contained demo of the Options API
// -----------------------------------------------------------

export default {
  name: 'Test',

  // 🧠 Reactive data (the "state" of your component)
  // This is where you store anything the component needs to remember or update.
  data() {
    return {
      loading: false,
      message: 'Hello, Vue!',
      count: 0,
      items: ['Apples', 'Bananas', 'Cherries'],
      error: ''
    }
  },

  // ⚙️ Computed properties automatically update when the data they depend on changes.
  // They’re used for things like formatting, filtering, or deriving new data.
  computed: {
    reversedMessage() {
      return this.message.split('').reverse().join('')
    }
  },

  // 🧰 Methods are functions you can call from the template (like @click="increment")
  // or from within the script itself.
  methods: {
    init() {
      console.log('Test.vue initialized')
    },

    increment() {
      this.count++
    },

    reset() {
      this.count = 0
    },

    handleError(msg) {
      this.error = msg
    }
  },

  // 🌱 Lifecycle hooks are built-in events that run automatically at certain stages.
  // `mounted()` runs when the component first appears on screen.
  mounted() {
    console.log('Mounted:', this.$options.name)
    this.init()
  }
}
</script>

<style scoped>
.test-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
  border: 2px solid #ccc;
  border-radius: 8px;
}

button {
  margin: 0.25rem;
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
