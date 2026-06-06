---
layout: doc
---

<script setup>
import { onMounted } from 'vue'
import { withBase } from 'vitepress'

onMounted(() => {
  const userLang = navigator.language || navigator.userLanguage
  if (userLang && userLang.toLowerCase().startsWith('en')) {
    window.location.replace(withBase('/en/'))
  } else {
    window.location.replace(withBase('/cn/'))
  }
})
</script>

Redirecting / 正在重定向...
