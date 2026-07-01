<script setup lang="ts">
defineProps<{
  show: Boolean,
}>()
</script>

<template>
  <Transition name="fade" mode="out-in">
    <div
      v-if="show"
      class="
      bg-trans-white
      absolute
      w-full
      h-full
      flex
      items-center
      justify-center
      z-1
    "
    >
      <svg
        class="animate-spin"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_2018_110)">
          <path d="M24 2C11.5687 1.99952 1.99987 11.9 2 24C2.00013 35.22 10.8932 46 24 46C36.1933 46 46 36.1 46 24" stroke="#114FD3" stroke-width="4" stroke-linecap="round" />
        </g>
        <defs>
          <clipPath id="clip0_2018_110">
            <rect width="48" height="48" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  </Transition>
</template>

<style scoped>

</style>
