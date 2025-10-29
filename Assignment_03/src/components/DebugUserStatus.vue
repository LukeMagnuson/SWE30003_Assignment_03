<template>
  <div class="debug-user-status" role="status" aria-live="polite">
    Current User Status: <span class="status">{{ statusLabel }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import auth from '../models/AuthenticationService';

const STORAGE_KEY = 'auth_token';
const statusLabel = ref('Customer');
let pollTimer = null;

function updateStatus() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    statusLabel.value = 'Customer';
    return;
  }
  try {
    const user = auth.validateSession(token);
    // try getRole, fallback to instance checks
    if (user && (user.getRole && user.getRole() === 'Admin')) {
      statusLabel.value = 'Admin';
    } else {
      statusLabel.value = 'Customer';
    }
  } catch (e) {
    // invalid/expired session => treat as Customer
    statusLabel.value = 'Customer';
  }
}

onMounted(() => {
  // seed if needed (keeps parity with other components)
  if (auth.seedIfEmpty) {
    try { auth.seedIfEmpty(); } catch { }
  }

  updateStatus();
  // poll occasionally to pick up session expiry/changes
  pollTimer = setInterval(updateStatus, 3000);

  // also listen to storage events (cross-tab login/logout)
  window.addEventListener('storage', updateStatus);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  window.removeEventListener('storage', updateStatus);
});
</script>

<style scoped>
.debug-user-status {
  position: fixed;
  right: 12px;
  bottom: 12px;
  color: #ff2e2e; /* red */
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  z-index: 9999;
  pointer-events: none; /* non-interactive */
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}

.debug-user-status .status {
  margin-left: 6px;
}
</style>
