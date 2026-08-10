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
  --cbox2-accent: var(--vp-c-brand-1, #10b981);
  --cbox2-bg: var(--vp-c-bg-soft);
  --cbox2-icon-bg: var(--vp-c-default-soft);
  --cbox2-icon-color: var(--cbox2-accent);

  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 825px;
  margin: 1.2em 0;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  border-left: 4px solid var(--cbox2-accent);
  background-color: var(--cbox2-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: background-color 0.25s, border-color 0.25s, box-shadow 0.25s;
  box-sizing: border-box;
}

.cbox2:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.cbox2-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  background-color: var(--cbox2-icon-bg);
  color: var(--cbox2-icon-color);
  font-size: 15px;
  box-sizing: border-box;
  transition: transform 0.2s ease, background-color 0.25s;
}

.cbox2:hover .cbox2-icon {
  transform: scale(1.05);
}

.cbox2-content {
  flex-grow: 1;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.cbox2-content p { margin: 0 0 4px; }
.cbox2-content p:last-child { margin-bottom: 0; }
.cbox2-content strong { font-weight: 600; color: var(--vp-c-text-1); }
.cbox2-content code {
  padding: 2px 6px;
  font-size: 0.85em;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
.cbox2-content a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: none;
}
.cbox2-content a:hover {
  text-decoration: underline;
}

/* 颜色系统 */
.cbox2-green {
  --cbox2-accent: #10b981;
  --cbox2-bg: var(--vp-c-green-soft, rgba(16, 185, 129, 0.08));
  --cbox2-icon-bg: rgba(16, 185, 129, 0.15);
  --cbox2-icon-color: #10b981;
}

.cbox2-blue {
  --cbox2-accent: #3b82f6;
  --cbox2-bg: var(--vp-c-indigo-soft, rgba(59, 130, 246, 0.08));
  --cbox2-icon-bg: rgba(59, 130, 246, 0.15);
  --cbox2-icon-color: #3b82f6;
}

.cbox2-orange {
  --cbox2-accent: #f59e0b;
  --cbox2-bg: var(--vp-c-warning-soft, rgba(245, 158, 11, 0.08));
  --cbox2-icon-bg: rgba(245, 158, 11, 0.15);
  --cbox2-icon-color: #f59e0b;
}

.dark .cbox2 {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.dark .cbox2-green {
  --cbox2-accent: #34d399;
  --cbox2-bg: rgba(16, 185, 129, 0.12);
  --cbox2-icon-bg: rgba(52, 211, 153, 0.2);
  --cbox2-icon-color: #34d399;
}
.dark .cbox2-blue {
  --cbox2-accent: #60a5fa;
  --cbox2-bg: rgba(59, 130, 246, 0.12);
  --cbox2-icon-bg: rgba(96, 165, 250, 0.2);
  --cbox2-icon-color: #60a5fa;
}
.dark .cbox2-orange {
  --cbox2-accent: #fbbf24;
  --cbox2-bg: rgba(245, 158, 11, 0.12);
  --cbox2-icon-bg: rgba(251, 191, 36, 0.2);
  --cbox2-icon-color: #fbbf24;
}
</style>