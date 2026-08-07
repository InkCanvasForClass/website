<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  spin?: boolean
}>()

// Map icon names to Font Awesome classes
const iconMap: Record<string, string> = {
  'arrow-left': 'fas fa-arrow-left',
  'arrow-right': 'fas fa-arrow-right',
  'arrow-up-right-from-square': 'fas fa-arrow-up-right-from-square',
  'bolt': 'fas fa-bolt',
  'bug': 'fas fa-bug',
  'certificate': 'fas fa-certificate',
  'circle-check': 'fas fa-circle-check',
  'circle-down': 'fas fa-circle-down',
  'circle-exclamation': 'fas fa-circle-exclamation',
  'circle-info': 'fas fa-circle-info',
  'circle-xmark': 'fas fa-circle-xmark',
  'clock': 'fas fa-clock',
  'code-commit': 'fas fa-code-commit',
  'desktop': 'fas fa-desktop',
  'download': 'fas fa-download',
  'file-zipper': 'fas fa-file-zipper',
  'flask': 'fas fa-flask',
  'hashtag': 'fas fa-hashtag',
  'inbox': 'fas fa-inbox',
  'moon': 'fas fa-moon',
  'note-sticky': 'fas fa-note-sticky',
  'rocket': 'fas fa-rocket',
  'screwdriver-wrench': 'fas fa-screwdriver-wrench',
  'shuffle': 'fas fa-shuffle',
  'skull-crossbones': 'fas fa-skull-crossbones',
  'spinner': 'fas fa-spinner',
  'triangle-exclamation': 'fas fa-triangle-exclamation',
  'wand-magic-sparkles': 'fas fa-wand-magic-sparkles',
}

const iconClass = computed(() => {
  // If it's already a full Font Awesome class, use as-is
  if (props.name.startsWith('fa-') || props.name.startsWith('fab ') || props.name.startsWith('fas ') || props.name.startsWith('far ')) {
    return props.name.startsWith('fa-') ? `fas ${props.name}` : props.name
  }
  return iconMap[props.name] || `fas fa-${props.name}`
})
</script>

<template>
  <i
    :class="[iconClass, { 'fa-spin': spin }]"
    class="icon-vue"
  />
</template>

<style scoped>
.icon-vue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  font-size: 1em;
}
</style>