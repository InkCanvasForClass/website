import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import BilibiliVideo from './components/BilibiliVideo.vue'
import Linkcard from "./components/Linkcard.vue"
import ArticleMetadata from "./components/ArticleMetadata.vue"
import HomeUnderline from "./components/HomeUnderline.vue"
import DownloadPage from './components/DownloadPage.vue'
import MyLayout from './components/MyLayout.vue'
import HelpUsImprove from './components/HelpUsImprove.vue'
import UnderConstruction from './components/UnderConstruction.vue'
import KnownBugs from './components/KnownBugs.vue'
import Cbox2 from './components/Cbox2.vue'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app }) {
    app.component('BilibiliVideo', BilibiliVideo);
    app.component('Linkcard' , Linkcard);
    app.component('ArticleMetadata' , ArticleMetadata);
    app.component('HomeUnderline' , HomeUnderline);
    app.component('DownloadPage', DownloadPage);
    app.component('HelpUsImprove', HelpUsImprove);
    app.component('UnderConstruction', UnderConstruction);
    app.component('KnownBugs', KnownBugs);
    app.component('Cbox2', Cbox2);
  },
} satisfies Theme
