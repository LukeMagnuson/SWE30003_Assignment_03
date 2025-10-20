<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/shop">Shop</RouterLink>
      <RouterLink to="/test">Test</RouterLink>
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
