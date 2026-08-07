<template>
  <div class="nomobile cbox2" :class="['cbox2-' + (color || 'green')]" style="max-width:100%;">
    <div class="cbox2-icon">
      <i :class="iconClass"></i>
    </div>
    <div class="cbox2-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Marked } from 'marked'

const marked = new Marked()

const props = defineProps({
  icon: {
    type: String,
    default: 'fas fa-circle-arrow-right'
  },
  color: {
    type: String,
    default: 'green',
    validator: (v: string) => ['green', 'blue', 'orange'].includes(v)
  }
})

const slots = useSlots()

const iconClass = computed(() => {
  const iconMap: Record<string, string> = {
    'arrow': 'fas fa-circle-arrow-right',
    'arrow-right': 'fas fa-circle-arrow-right',
    'arrow-top-right': 'fas fa-arrow-up-right-from-square',
    'external': 'fas fa-external-link-alt',
    'info': 'fas fa-info-circle',
    'tip': 'fas fa-lightbulb',
    'link': 'fas fa-link',
    'book': 'fas fa-book',
    'warn': 'fas fa-exclamation-triangle',
    'warning': 'fas fa-exclamation-triangle',
    'note': 'fas fa-sticky-note',
    'star': 'fas fa-star',
    'download': 'fas fa-download',
    'github': 'fab fa-github',
    'code': 'fas fa-code',
    'search': 'fas fa-search',
    'question': 'fas fa-question-circle',
    'cog': 'fas fa-cog',
    'home': 'fas fa-home',
    'file': 'fas fa-file',
    'folder': 'fas fa-folder',
    'tag': 'fas fa-tag',
    'tags': 'fas fa-tags',
    'user': 'fas fa-user',
    'users': 'fas fa-users',
    'clock': 'fas fa-clock',
    'calendar': 'fas fa-calendar',
    'check': 'fas fa-check-circle',
    'times': 'fas fa-times-circle',
    'plus': 'fas fa-plus-circle',
    'minus': 'fas fa-minus-circle',
    'heart': 'fas fa-heart',
    'thumbs-up': 'fas fa-thumbs-up',
    'comment': 'fas fa-comment',
    'envelope': 'fas fa-envelope',
    'globe': 'fas fa-globe',
    'lock': 'fas fa-lock',
    'unlock': 'fas fa-unlock',
    'eye': 'fas fa-eye',
    'pencil': 'fas fa-pencil-alt',
    'trash': 'fas fa-trash-alt',
    'sync': 'fas fa-sync',
    'refresh': 'fas fa-redo',
    'play': 'fas fa-play',
    'pause': 'fas fa-pause',
    'stop': 'fas fa-stop',
    'camera': 'fas fa-camera',
    'image': 'fas fa-image',
    'video': 'fas fa-video',
    'music': 'fas fa-music',
    'microphone': 'fas fa-microphone',
    'print': 'fas fa-print',
    'share': 'fas fa-share-alt',
    'rss': 'fas fa-rss',
    'chart': 'fas fa-chart-bar',
    'bell': 'fas fa-bell',
    'flag': 'fas fa-flag',
    'bug': 'fas fa-bug',
    'warning-sign': 'fas fa-exclamation-triangle',
    'question-circle': 'fas fa-question-circle',
    'info-circle': 'fas fa-info-circle',
    'check-circle': 'fas fa-check-circle',
    'times-circle': 'fas fa-times-circle',
    'plus-circle': 'fas fa-plus-circle',
    'minus-circle': 'fas fa-minus-circle',
    'exclamation-circle': 'fas fa-exclamation-circle',
    'exclamation-triangle': 'fas fa-exclamation-triangle',
  }

  const iconStr = props.icon
  // Full Font Awesome class: use as-is
  if (iconStr.startsWith('fa ') || iconStr.startsWith('fab ') || iconStr.startsWith('fas ') || iconStr.startsWith('far ')) {
    return iconStr
  }
  // Short name: look up in map
  if (iconMap[iconStr]) return iconMap[iconStr]
  // Fallback to default arrow
  return 'fas fa-circle-arrow-right'
})

const renderedContent = computed(() => {
  const defaultSlot = slots.default
  if (!defaultSlot) return ''

  const vnodes = defaultSlot()
  const rawText = extractText(vnodes)
  const trimmed = rawText.trim()
  if (!trimmed) return ''

  return marked.parse(trimmed, { async: false }) as string
})

function extractText(nodes: any): string {
  let result = ''
  if (!nodes) return ''
  const arr = Array.isArray(nodes) ? nodes : [nodes]
  for (const node of arr) {
    if (typeof node === 'string') {
      result += node
    } else if (typeof node === 'object' && node !== null) {
      // VNode text children
      if (typeof node.children === 'string') {
        result += node.children
      } else if (Array.isArray(node.children)) {
        result += extractText(node.children)
      }
    }
  }
  return result
}
</script>

<style>
.cbox2 {
  display: flex;
  width: 100%;
  max-width: 825px;
  margin: 12px 0;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}
.cbox2-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  padding: 6px;
  box-sizing: border-box;
  font: 900 18px/1 "Font Awesome 6 Free";
}
.cbox2-content {
  flex-grow: 1;
  padding: 6px 10px;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 1.4;
}
.cbox2-content p { margin: 0 0 4px; }
.cbox2-content p:last-child { margin-bottom: 0; }
.cbox2-content strong { font-weight: 600; }
.cbox2-content code {
  padding: 1px 4px;
  font-size: 0.85em;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
}
.cbox2-content a { color: #0645ad; text-decoration: none; }
.cbox2-content a:hover { text-decoration: underline; }

.cbox2-green { background: #f9ffea; }
.cbox2-green .cbox2-icon { background: #b9e66b; color: #84b63c; }
.cbox2-blue { background: #f3f6ff; }
.cbox2-blue .cbox2-icon { background: #6688cc; color: #4466aa; }
.cbox2-orange { background: #fff8f0; }
.cbox2-orange .cbox2-icon { background: #f0b060; color: #cc8844; }

.dark .cbox2-green { background: #2a3a1a; border-color: #4a6a2a; }
.dark .cbox2-green .cbox2-icon { background: #4a7a2a; color: #8ac44a; }
.dark .cbox2-blue { background: #1a2a3a; border-color: #2a4a6a; }
.dark .cbox2-blue .cbox2-icon { background: #2a4a7a; color: #6a9ac4; }
.dark .cbox2-orange { background: #3a2a1a; border-color: #6a4a2a; }
.dark .cbox2-orange .cbox2-icon { background: #6a4a2a; color: #c4a060; }
.dark .cbox2-content a { color: #6eb4f7; }
.dark .cbox2-content a:visited { color: #9b7fd4; }
</style>