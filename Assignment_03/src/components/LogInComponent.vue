<template>
  <div class="p-4">
    <h2><router-link to="/signup">Sign Up</router-link> | Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" placeholder="Email" class="form-control mb-2" />
      <input v-model="password" type="password" placeholder="Password" class="form-control mb-2" />
      <button class="btn btn-primary">Login</button>
      <p class="text-danger mt-2" v-if="error">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import { loginUser } from '../auth/authStore'
import { authService } from '../auth/authService'

export default {
  data () {
    return {
      email: '',
      password: '',
      error: ''
    }
  },
  methods: {
    handleLogin () {
      try {
        const user = authService.login(this.email, this.password)
        loginUser(user)
        this.$router.push('/')
      } catch (e) {
        this.error = e.message
      }
    }
  }
}
</script>
