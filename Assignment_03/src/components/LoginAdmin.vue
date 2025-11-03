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

      <hr />
      <details class="register">
        <summary><strong>Register a new user</strong></summary>
        <form class="register-form" @submit.prevent="doRegister">
          <div class="row">
            <label>
              Account Type <span class="demo-note" aria-label="demo only">(For demo purposes)</span>
              <select v-model="reg.type" required>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <div class="row">
            <label>Name <input v-model="reg.name" required /></label>
          </div>
          <div class="row two">
            <label>Email <input v-model="reg.email" type="email" required /></label>
            <label>Phone <input v-model="reg.phone" type="tel" /></label>
          </div>
          <div class="row">
            <label>Password <input v-model="reg.password" type="password" minlength="6" required /></label>
          </div>
          <div class="row" v-if="reg.type === 'customer'">
            <label>Delivery Address <input v-model="reg.deliveryAddress" /></label>
          </div>
          <div class="actions">
            <button type="submit">Create Account</button>
            <button type="button" @click="resetReg">Reset</button>
          </div>
          <p class="submessage" v-if="regMessage">{{ regMessage }}</p>
        </form>
      </details>
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
      token: null,
      reg: {
        type: 'customer',
        name: '',
        email: '',
        phone: '',
        password: '',
        deliveryAddress: ''
      },
      regMessage: ''
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
    async generateUserId(prefix) {
      // Use json-server counters to ensure monotonically increasing IDs (no reuse after deletion)
      const base = 'http://localhost:3000/counters';
      const key = prefix === 'admin' ? 'admin' : 'customer';
      // Ensure counter exists; GET /counters/:id returns the record or 404
      let ctr;
      try {
        const res = await fetch(`${base}/${key}`);
        if (res.ok) {
          ctr = await res.json();
        } else if (res.status === 404) {
          // initialize
          const init = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, next: 1 }) });
          ctr = await init.json();
        } else {
          throw new Error(`Counter fetch failed: ${res.status}`);
        }
      } catch (e) {
        console.error('Counter init error', e);
        throw e;
      }

      const seq = typeof ctr.next === 'number' ? ctr.next : 1;

      // Increment counter: PATCH /counters/:id { next: seq + 1 }
      try {
        await fetch(`${base}/${key}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ next: seq + 1 }) });
      } catch (e) {
        console.warn('Counter increment failed', e);
      }

      return `${prefix}-${seq}`;
    },
    async doRegister() {
      this.regMessage = '';
      try {
  const type = this.reg.type === 'admin' ? 'admin' : 'customer';
  const userId = await this.generateUserId(type === 'admin' ? 'admin' : 'cust');
        const createdAtISO = new Date().toISOString();

        // Create user in in-memory AuthenticationService for session support
        auth.registerUser(
          type,
          userId,
          this.reg.name,
          this.reg.email,
          this.reg.password,
          type === 'admin'
            ? { phone: this.reg.phone, permissions: ['catalog:write'] }
            : { phone: this.reg.phone, deliveryAddress: this.reg.deliveryAddress }
        );

        // Persist to json-server (db.json)
        const endpoint = type === 'admin' ? 'http://localhost:3000/admins' : 'http://localhost:3000/customers';
        const dto = {
          id: userId,
          name: this.reg.name,
          email: this.reg.email,
          phone: this.reg.phone || undefined,
          role: type === 'admin' ? 'Admin' : 'Customer',
          createdAt: createdAtISO,
          ...(type === 'admin'
            ? { permissions: ['catalog:write'] }
            : { deliveryAddress: this.reg.deliveryAddress || undefined }),
          // Store password as provided (demo only)
          password: this.reg.password
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto)
        });
        if (!res.ok) throw new Error(`Register failed: ${res.status}`);

        this.regMessage = `Account created for ${this.reg.email}. You can now log in.`;
        // await this.doLoginWith(this.reg.email, this.reg.password)
        this.resetReg();
      } catch (err) {
        console.error('Register error', err);
        this.regMessage = err.message || 'Registration failed';
      }
    },
    resetReg() {
      this.reg = { type: 'customer', name: '', email: '', phone: '', password: '', deliveryAddress: '' };
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
.demo-note { color:#b00; font-weight:600; margin-left:0.25rem; }
</style>