<template>
  <section>
    <h1>Welcome to Your Local Shop!</h1>
    
    <div class="home-links">
      <router-link to="/shop" class="home-link">
        <h2>Browse what we have available!</h2>
      </router-link>

      <router-link to="/login" class="home-link">
        <h2>Log in for a more streamlined shopping experience!</h2>
      </router-link>

      <router-link to="/about" class="home-link">
        <h2>Learn more about Your Local Shop!</h2>
      </router-link>
    </div>
  </section>
</template>

<script setup></script>

<style scoped>
section {
  padding: 20px;
  text-align: center;
}

.home-links {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center; /* center link cards horizontally */
}

.home-link {
  text-decoration: none;
  color: inherit;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  display: block;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  transition: background 0.15s ease, transform 0.08s ease;
}

.home-link:hover {
  background: rgba(0,0,0,0.03);
  transform: translateY(-2px);
}

.home-link {
  /* button-like appearance */
  color: #fff;
  border: 4px solid #d1d5db;
  box-shadow: 0 6px 12px rgba(37,99,235,0.12);
  padding: 14px 18px;
  font-weight: 600;
  text-align: center;
}

.home-link h2 {
  margin: 0;
  font-size: 1.05rem;
}

.home-link:hover {
  transform: translateY(-3px);
  filter: brightness(0.95);
}

.home-link:focus {
  outline: 3px solid rgba(59,130,246,0.25);
  outline-offset: 3px;
}
</style>
