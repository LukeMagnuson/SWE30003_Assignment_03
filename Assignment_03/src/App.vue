<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue';
import SiteHeader from './components/SiteHeader.vue';

</script>

<template>
  <div class="app-container">
    <SiteHeader />

    <main>
      <RouterView />
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.app-container {
  /* Make the app fill the screen */
  min-height: 100vh;

  /* Stack children vertically */
  display: flex;
  flex-direction: column;
}

main {
  /* Take up all available space between header and footer */
  flex: 1;
}
</style>
