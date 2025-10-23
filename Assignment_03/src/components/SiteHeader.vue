<template>
  <header>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/shop">Shop</router-link>
      <router-link to="/about">About</router-link>
      <router-link to="/login">Login</router-link>
    </nav>
  </header>
</template>

<script setup>
// No special logic yet
</script>

<style scoped>
header {
  background: #222;
  padding: 10px 20px;
}
nav a {
  color: white;
  text-decoration: none;
  margin-right: 15px;
}
nav a:hover {
  text-decoration: underline;
}
</style>
