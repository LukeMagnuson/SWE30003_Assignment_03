<template>
  <section>
    <transition name="slide-fade">
      <div v-if="showUnauthorised" class="unauthorised-banner" role="alert" aria-live="assertive">
        Unauthorised access — you have been redirected to the homepage.
      </div>
    </transition>
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

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const showUnauthorised = ref(false);
let timer = null;

function startBanner() {
  showUnauthorised.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    showUnauthorised.value = false;
    // remove the query param so the banner doesn't reappear on refresh
    const q = { ...route.query };
    if (q.unauthorised) {
      delete q.unauthorised;
      router.replace({ path: route.path, query: q }).catch(() => {});
    }
  }, 3000);
}

onMounted(() => {
  if (route.query && route.query.unauthorised) startBanner();
});

watch(() => route.query.unauthorised, (val) => {
  if (val) startBanner();
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

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

.unauthorised-banner {
  background: #fff1f0;
  color: #b42318;
  border: 1px solid #fecaca;
  padding: 10px 14px;
  border-radius: 6px;
  margin: 0 auto 16px auto;
  max-width: 760px;
  font-weight: 600;
}

/* slide + fade transition for the banner */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 260ms cubic-bezier(.2,.8,.2,1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
