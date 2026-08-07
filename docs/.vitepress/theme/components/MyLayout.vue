<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import backtotop from "./backtotop.vue";
</script>

<template>
  <DefaultTheme.Layout v-bind="$attrs">
    <template #doc-footer-before>
      <backtotop />
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
</style>