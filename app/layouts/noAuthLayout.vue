<script setup lang="ts">
</script>

<template>
  <div class="container">
    <slot/>
  </div>

  <NotificationsSlideover/>
</template>


<style>
.container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 32px;
}
</style>
