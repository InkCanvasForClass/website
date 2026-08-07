<script lang="ts" setup>
import { useData } from 'vitepress'
const { lang } = useData()
</script>

<template>
  <div class="busuanzi">
    <template v-if="lang === 'en-US'">
      Total Visitors <span id="busuanzi_value_site_uv" /> | Total Views <span id="busuanzi_value_site_pv" />
    </template>
    <template v-else>
      本站访客数 <span id="busuanzi_value_site_uv" /> 人次 本站总访问量 <span id="busuanzi_value_site_pv" /> 次
    </template>
  </div>
</template>

<style>
.busuanzi {
  font-size: 15px;
  color: gray;
  text-align: center;
}
</style>