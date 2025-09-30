import { onMounted, watch, nextTick } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute, inBrowser } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import './style/index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import mediumZoom from 'medium-zoom'
import busuanzi from 'busuanzi.pure.js'
import BilibiliVideo from './components/BilibiliVideo.vue'
import bsz from "./components/bsz.vue"
import Linkcard from "./components/Linkcard.vue"
import ArticleMetadata from "./components/ArticleMetadata.vue"
import HomeUnderline from "./components/HomeUnderline.vue"
import DownloadPage from './components/DownloadPage.vue'
import MyLayout from './components/MyLayout.vue'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app, router }) {
    app.component('BilibiliVideo', BilibiliVideo);
    app.component('Linkcard' , Linkcard);
    app.component('ArticleMetadata' , ArticleMetadata);
    app.component('HomeUnderline' , HomeUnderline);
    app.component('DownloadPage', DownloadPage);
    if (inBrowser) {
      router.onAfterRouteChanged = () => {
        busuanzi.fetch()
      }
    }
  },
  setup() {
    const route = useRoute();
    const initZoom = () => {
      // mediumZoom('[data-zoomable]', { background: 'var(--vp-c-bg)' }); // 默认
      mediumZoom('.main img', { background: 'var(--vp-c-bg)' }); // 不显式添加{data-zoomable}的情况下为所有图像启用此功能
    };
    onMounted(() => {
      initZoom();
    });
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    );
  },
} satisfies Theme
