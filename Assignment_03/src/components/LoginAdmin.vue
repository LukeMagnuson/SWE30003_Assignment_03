<template>
  <div class="login-admin">
    <h2>Login</h2>

    <div v-if="!currentUser" class="login-form">
      <form @submit.prevent="doLogin">
        <div>
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required />
        </div>
        <div>
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required />
        </div>
        <div class="actions">
          <button type="submit">Log in</button>
        </div>
      </form>
      <p class="message" v-if="message">{{ message }}</p>
      <p class="hint">Demo accounts (from seeded AuthenticationService): admin@store.test / adminpass</p>
    </div>

    <div v-else class="logged-in">
      <p>
        Signed in as: <strong>{{ currentUser.name }}</strong> — role:
        <strong>{{ currentUserRole }}</strong>
      </p>

      <div class="actions">
        <button @click="doLogout">Log out</button>
        <router-link v-if="isAdmin" to="/admin">Open Admin Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import auth from '../models/AuthenticationService';

const STORAGE_KEY = 'auth_token';

export default {
  name: 'LoginAdmin',
  data() {
    return {
      email: '',
      password: '',
      message: '',
      currentUser: null,
      token: null
    };
  },
  computed: {
    currentUserRole() {
      if (!this.currentUser) return '';
      return this.currentUser.getRole ? this.currentUser.getRole() : (this.currentUser.role || '');
    },
    isAdmin() {
      // Admin objects return 'Admin' from getRole()
      return this.currentUser && this.currentUser.getRole && this.currentUser.getRole() === 'Admin';
    }
  },
  methods: {
    async doLogin() {
      try {
        this.message = '';
        // AuthenticationService.login returns a token string or throws
        const token = auth.login(this.email, this.password);
        // store token
        localStorage.setItem(STORAGE_KEY, token);
        this.token = token;
        // validate and retrieve user object
        const user = auth.validateSession(token);
        this.currentUser = user;
        this.message = `Welcome, ${user.name}`;
      } catch (err) {
        this.message = err.message || 'Login failed';
        console.error('Login error', err);
      }
    },
    doLogout() {
      try {
        if (this.token) auth.logout(this.token);
      } catch (e) {
        // ignore
      }
      localStorage.removeItem(STORAGE_KEY);
      this.token = null;
      this.currentUser = null;
      this.email = '';
      this.password = '';
      this.message = 'Logged out';
    },
    tryRestoreSession() {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) return;
      try {
        const user = auth.validateSession(token);
        this.token = token;
        this.currentUser = user;
      } catch (err) {
        // session invalid/expired — clear
        localStorage.removeItem(STORAGE_KEY);
        this.token = null;
        this.currentUser = null;
      }
    }
  },
  mounted() {
    // seed demo users if service is empty (optional)
    if (auth.seedIfEmpty) {
      try { auth.seedIfEmpty(); } catch { /* ignore */ }
    }
    this.tryRestoreSession();
  }
};
</script>

<style scoped>
.login-admin { max-width: 640px; margin: 0 auto; padding: 1rem; }
.login-form input { display:block; width:100%; margin:0.25rem 0 0.75rem; padding:0.5rem; }
.actions { margin-top:0.5rem; display:flex; gap:0.5rem; align-items:center; }
.message { color: #b00; margin-top:0.5rem; }
.hint { color:#666; font-size:0.9rem; margin-top:0.5rem; }
.logged-in { padding:0.5rem 0; }
</style>