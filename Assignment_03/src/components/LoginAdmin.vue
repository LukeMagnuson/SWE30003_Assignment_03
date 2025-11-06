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
    async fetchAccountByEmail(email) {
      const e = String(email || '').trim().toLowerCase();
      if (!e) return null;
      const base = 'http://localhost:3000';
      try {
        const [cRes, aRes] = await Promise.all([
          fetch(`${base}/customers?email=${encodeURIComponent(e)}`),
          fetch(`${base}/admins?email=${encodeURIComponent(e)}`)
        ]);
        const [cArr, aArr] = await Promise.all([
          cRes.ok ? cRes.json() : [],
          aRes.ok ? aRes.json() : []
        ]);
        const norm = (u, role) => ({
          id: u.id,
          name: u.name,
          email: (u.email || '').toLowerCase(),
          phone: u.phone,
          role,
          deliveryAddress: u.deliveryAddress,
          permissions: Array.isArray(u.permissions) ? u.permissions : [],
          password: u.password
        });
        if (Array.isArray(aArr) && aArr.length > 0) return norm(aArr[0], 'Admin');
        if (Array.isArray(cArr) && cArr.length > 0) return norm(cArr[0], 'Customer');
        return null;
      } catch (e) {
        // Surface an error up so the UI can inform the user the API isn't running
        throw new Error('Unable to reach the database API at http://localhost:3000. Please start it with "npm run serve:api".');
      }
    },
    async isEmailRegisteredInDb(email) {
      const e = String(email || '').trim().toLowerCase();
      if (!e) return false;
      try {
        const [cRes, aRes] = await Promise.all([
          fetch(`http://localhost:3000/customers?email=${encodeURIComponent(e)}`),
          fetch(`http://localhost:3000/admins?email=${encodeURIComponent(e)}`)
        ]);
        const [cArr, aArr] = await Promise.all([
          cRes.ok ? cRes.json() : [],
          aRes.ok ? aRes.json() : []
        ]);
        const found = (arr) => Array.isArray(arr) && arr.some(u => String(u.email||'').toLowerCase() === e);
        return found(cArr) || found(aArr);
      } catch {
        // If API unavailable, fall back to allowing registration (auth service will still guard duplicates)
        return false;
      }
    },
    async doLogin() {
      try {
        this.message = '';
        const email = String(this.email || '').trim().toLowerCase();

        // 1) Fetch the authoritative account from the database (json-server)
        const account = await this.fetchAccountByEmail(email);
        if (!account) {
          this.message = 'Account not found in the database.';
          return;
        }

        // 2) Ensure AuthenticationService knows about this account (seed into memory)
        const type = account.role === 'Admin' ? 'admin' : 'customer';
        try {
          auth.registerUser(
            type,
            account.id,
            account.name,
            account.email,
            account.password,
            type === 'admin'
              ? { phone: account.phone, permissions: account.permissions }
              : { phone: account.phone, deliveryAddress: account.deliveryAddress }
          );
        } catch (e) {
          // If it's already present in-memory, ignore duplicate error
          if (!/Email already registered/i.test(e?.message || '')) throw e;
        }

        // 3) Proceed with normal login using the in-memory service
        const token = auth.login(this.email, this.password);
        localStorage.setItem(STORAGE_KEY, token);
        this.token = token;
        const user = auth.validateSession(token);
        this.currentUser = user;
        this.message = `Welcome, ${user.name}`;
      } catch (err) {
        this.message = err.message || 'Login failed';
        console.error('Login error', err);
      }
    },
    async generateUserId(prefix) {
      // Peek next number without incrementing; we'll increment only after successful registration.
      const base = 'http://localhost:3000/counters';
      const key = prefix === 'admin' ? 'admin' : 'customer';
      let ctr;
      try {
        const res = await fetch(`${base}/${key}`);
        if (res.ok) {
          ctr = await res.json();
        } else if (res.status === 404) {
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
      return { id: `${prefix}-${seq}`, key, next: seq + 1 };
    },
    async bumpCounter(key, expectedNext) {
      const base = 'http://localhost:3000/counters';
      try {
        const res = await fetch(`${base}/${key}`);
        if (!res.ok) return;
        const ctr = await res.json();
        const currentNext = typeof ctr.next === 'number' ? ctr.next : 1;
        if (currentNext < expectedNext) {
          await fetch(`${base}/${key}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ next: expectedNext }) });
        }
      } catch (e) {
        console.warn('Counter bump failed', e);
      }
    },
    async doRegister() {
      this.regMessage = '';
      try {
        const type = this.reg.type === 'admin' ? 'admin' : 'customer';
        // 0) Check database for existing email first (authoritative)
        const exists = await this.isEmailRegisteredInDb(this.reg.email);
        if (exists) {
          this.regMessage = 'Email is already registered.';
          return;
        }

        const gen = await this.generateUserId(type === 'admin' ? 'admin' : 'cust');
        const userId = gen.id;
        const createdAtISO = new Date().toISOString();

        // Create user in in-memory AuthenticationService for session support
        try {
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
        } catch (err) {
          // If the in-memory service thinks the email exists, but DB says it doesn't,
          // clear cached auth state and ask user to retry (no counter bump yet, so id won't be lost).
          const dbStillFree = !(await this.isEmailRegisteredInDb(this.reg.email));
          if (dbStillFree && /Email already registered/i.test(err?.message||'')) {
            // Persist pending registration and hard-reload so the auth service reinitializes from empty state
            try { sessionStorage.setItem('pending_reg_v1', JSON.stringify({ reg: this.reg })); } catch {}
            try { localStorage.removeItem('auth_state_v1'); } catch {}
            // reload to recreate the singleton without stale users
            window.location.reload();
            return;
          }
          throw err;
        }

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

        // Only now do we bump the counter; failed registrations won't advance it.
        await this.bumpCounter(gen.key, gen.next);

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
  async mounted() {
    // If resuming a pending registration (after reload), skip seeding to avoid noise
    const pendingRaw = sessionStorage.getItem('pending_reg_v1');
    const hasPending = !!pendingRaw;
    if (!hasPending && auth.seedIfEmpty) {
      try { auth.seedIfEmpty(); } catch { /* ignore */ }
    }
    this.tryRestoreSession();

    // Auto-resume registration after reload
    if (hasPending) {
      try {
        const pending = JSON.parse(pendingRaw);
        if (pending && pending.reg) {
          this.reg = { ...this.reg, ...pending.reg };
          // Attempt registration again (now with fresh auth state)
          // Await to capture messages correctly
          await this.doRegister();
        }
      } catch (e) {
        // ignore resume errors
      } finally {
        try { sessionStorage.removeItem('pending_reg_v1'); } catch {}
      }
    }
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