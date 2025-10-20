<template>
  <div class="p-4">
    <h2>Signup | <router-link to="/login">Log In</router-link> </h2>
    <form @submit.prevent="handleSignup">
      <input v-model="name" placeholder="Name" class="form-control mb-2" />
      <input v-model="email" placeholder="Email" class="form-control mb-2" />
      <input v-model="password" type="password" placeholder="Password" class="form-control mb-2" />
      <button class="btn btn-success">Sign Up</button>
      <p class="text-danger mt-2" v-if="error">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import { authService } from '../auth/authService'
import { loginUser } from '../auth/authStore'

export default {
  data () {
    return {
      name: '',
      email: '',
      password: '',
      error: ''
    }
  },
  methods: {
    isValidEmail (email) {
      // Basic regex for email validation
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return regex.test(email)
    },
    handleSignup () {
      if (!this.name || !this.email || !this.password) {
        this.error = 'All fields are required.'
        return
      }

      if (!this.isValidEmail(this.email)) {
        this.error = 'Please enter a valid email address.'
        return
      }

      try {
        const user = authService.signup(this.name, this.email, this.password)
        loginUser(user)
        this.$router.push('/')
      } catch (e) {
        this.error = e.message
      }
    }
  }
}
</script>
