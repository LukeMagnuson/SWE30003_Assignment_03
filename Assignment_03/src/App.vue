<template>
  <div class="app-container">
    <header>
      <h1>My Site</h1>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <p>© 2025 My Website</p>
    </footer>
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
