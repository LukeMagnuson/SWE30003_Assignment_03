<template>
  <header>
    <div class="container">
      <router-link to="/" class="logo" aria-label="Your Local Shop home">
        <img :src="logo" alt="YLS Logo" />
      </router-link>

      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/shop">Shop</router-link>
        <router-link to="/about">About</router-link>
        <router-link to="/login">Login</router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import logo from '../../images/YLSLogo.png';
</script>

<style scoped>
header {
  background: #222;
  position: relative; /* allow absolutely positioned corners */
  min-height: 64px; /* ensure enough vertical space for larger logo */
  padding: 4px 0; /* keep vertical breathing room but remove horizontal padding so corners align reliably */
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  display: block; /* container used for centered content if needed */
}

.logo {
  position: absolute;
  left: 8px; /* corner offset from viewport edge */
  top: 50%;
  transform: translateY(-50%);
  display: block;
  padding: 0; /* remove inner padding so image sits flush */
}

.logo img {
  height: 56px; /* main logo size */
  display: block;
}

nav {
  position: absolute;
  right: 8px; /* corner offset from viewport edge */
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
}

nav a:hover {
  text-decoration: underline;
}

/* Responsive tweaks: reduce logo and spacing on small viewports */
@media (max-width: 520px) {
  .logo img {
    height: 44px;
  }
  nav {
    gap: 8px;
    right: 6px;
  }
  nav a {
    padding: 4px 6px;
    font-size: 0.95rem;
  }
}
</style>
