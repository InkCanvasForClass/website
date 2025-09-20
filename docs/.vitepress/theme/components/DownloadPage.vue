<template>
  <div class="download-container">
    <div class="release-info" id="release-info">
      <div class="header-grid">
        <div v-if="smartTeachAvailable" class="status-chip smart-teach-chip">
          <span class="material-symbols-outlined">school</span>
          <span class="typescale-body-medium">智教镜像可用</span>
        </div>
        <div v-else-if="fastestMirror" class="status-chip mirror-chip">
          <span class="material-symbols-outlined">travel_explore</span>
          <span class="typescale-body-medium">已连接到最快镜像源</span>
        </div>
        <div v-else class="status-chip error-chip">
          <span class="material-symbols-outlined">error</span>
          <span class="typescale-body-medium">所有镜像源均不可用，可能影响下载</span>
        </div>

        <button id="toggle-beta" class="btn btn--tonal toggle-beta-btn" @click="toggleBeta">
          <span class="material-symbols-outlined">{{ showingBeta ? 'verified' : 'science' }}</span>
          <span>{{ showingBeta ? '显示正式版' : '显示测试版' }}</span>
        </button>
      </div>
      
      <div v-if="loading" id="release-loading" class="release-loading">
        <div class="loader"></div>
        <p class="typescale-body-medium">{{ loadingText }}</p>
      </div>

      <div v-else id="release-list" class="release-grid">
        <article class="release-item card card--filled" v-for="(release, index) in paginatedReleases" :key="release.id">
          <header class="release-item-header">
            <a :href="release.html_url" target="_blank" class="typescale-title-large" style="text-decoration: underline;">{{ release.name || release.tag_name }}</a>
            <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
              <span class="typescale-body-medium card-subtitle">{{ formatDate(release.published_at) }}</span>
              <div v-if="release._isBeta" class="chip chip--small">测试版</div>
              <div v-else class="chip chip--small" style="background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);">正式版</div>
            </div>
          </header>
          <div class="markdown-body card-subtitle" v-html="renderMarkdown(release.body)"></div>
          <div class="divider"></div>
          <h4 class="typescale-title-medium" style="margin-bottom: 0.75rem;">附件</h4>
          <footer class="release-item-actions">
            <button v-for="asset in release.assets" :key="asset.id" class="btn btn--tonal download-btn" @click="showDownloadModal(asset, release._isBeta)">
              <span class="material-symbols-outlined">download</span>
              <span>{{ asset.name }} ({{ (asset.size / 1024 / 1024).toFixed(2) }} MB)</span>
            </button>
            <p v-if="release.assets.length === 0" class="typescale-body-medium card-subtitle">无可用附件</p>
          </footer>
        </article>
      </div>
    </div>

    <dialog class="modal" ref="downloadModalRef">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="typescale-headline-small">正在为您准备下载...</h3>
          <button class="btn btn--icon" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="typescale-body-large" id="thank-you-text">感谢您下载 InkCanvasforClass-Community</p>
          <div class="countdown-container">
            <p class="typescale-title-medium">将在 <span id="countdown" class="typescale-headline-large countdown-number">{{ countdownValue }}</span> 秒后自动下载。</p>
          </div>
          <div class="btn-group" style="margin-top: 2rem;">
            <a :href="downloadUrl" id="manual-download" class="btn btn--filled">
              单击此处下载
            </a>
            <a href="https://inkcanvasforclass.github.io/website" id="docs-link" target="_blank" class="btn btn--text">
              <span class="material-symbols-outlined">menu_book</span>
              <span>查看使用文档</span>
            </a>
          </div>
          <p id="manual-download-tip" class="typescale-body-small" v-if="manualDownloadTipVisible">如果自动下载未开始，请点击上方链接。</p>
        </div>
        <div class="modal-actions">
          <button id="close-modal" class="btn btn--text" @click="closeModal">关闭</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { marked } from 'marked';

// --- 状态管理 ---
const smartTeachAvailable = ref(false);
const fastestMirror = ref(null);
const releasesOfficial = ref([]);
const releasesBeta = ref([]);
const currentReleases = ref([]);
const currentIndex = ref(0);
const showingBeta = ref(false);
const loading = ref(true);
const loadingText = ref('正在加载...');
const downloadModalRef = ref(null);
const downloadUrl = ref('');
const countdownValue = ref(5);
const countdownInterval = ref(null);
const manualDownloadTipVisible = ref(false);

// --- 常量 ---
const SMART_TEACH_DOMAIN = "https://get.smart-teach.cn";
const COMMUNITY_PATH = "/d/Ningbo-S3/shared/jiangling/community";
const COMMUNITY_BETA_PATH = "/d/Ningbo-S3/shared/jiangling/community-beta";
const GITHUB_REPO_COMMUNITY = "InkCanvasForClass/community";
const GITHUB_REPO_COMMUNITY_BETA = "InkCanvasForClass/community-beta";
const GITHUB_API_BASE = "https://api.github.com/repos/";
const MIRROR_URLS = [
    "https://gh.llkk.cc",
    "https://ghfile.geekertao.top",
    "https://gh.dpik.top",
    "https://github.dpik.top",
    "https://github.acmsz.top",
    "https://git.yylx.win"
];

// --- 计算属性 ---
const paginatedReleases = computed(() => {
  if (showingBeta.value) {
    const all = [...releasesOfficial.value.map(r => ({ ...r, _isBeta: false })), ...releasesBeta.value.map(r => ({ ...r, _isBeta: true }))];
    return all.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  } else {
    return releasesOfficial.value;
  }
});

// --- API与镜像处理 ---
const buildApiUrls = (endpoint) => {
    const uniqueUrls = new Set();
    if (fastestMirror.value) {
        uniqueUrls.add(`${fastestMirror.value}/${GITHUB_API_BASE}${endpoint}`);
    }
    uniqueUrls.add(`${GITHUB_API_BASE}${endpoint}`);
    MIRROR_URLS.forEach(mirror => uniqueUrls.add(`${mirror}/${GITHUB_API_BASE}${endpoint}`));
    return Array.from(uniqueUrls);
};

const extractVersionFromUrl = (url) => {
    const regex = /InkCanvasForClass\.CE\.(\d+\.\d+\.\d+\.\d+)\.zip/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const testSmartTeachAvailability = async () => {
  try {
    const testUrl = `${SMART_TEACH_DOMAIN}${COMMUNITY_PATH}/test.txt`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    return response.status === 200 || response.status < 400;
  } catch (e) {
    return false;
  }
};

const convertDownloadUrl = (url, isBeta) => {
    if (url.endsWith('.exe')) {
        return fastestMirror.value ? url.replace("https://github.com/", `${fastestMirror.value}/https://github.com/`) : url;
    }
    if (smartTeachAvailable.value) {
        const fileName = url.split('/').pop();
        const basePath = isBeta ? COMMUNITY_BETA_PATH : COMMUNITY_PATH;
        return `${SMART_TEACH_DOMAIN}${basePath}/${fileName}`;
    }
    return fastestMirror.value ? url.replace("https://github.com/", `${fastestMirror.value}/https://github.com/`) : url;
};

const fetchDataWithMirrors = async (urls, errorMessage = "获取数据失败") => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return await res.json();
      console.log(`尝试镜像失败: ${url}, 状态码: ${res.status}`);
    } catch (e) {
      console.log(`尝试镜像失败: ${url}, 错误: ${e.message}`);
    }
  }
  loadingText.value = errorMessage;
  return null;
};

const detectFastestMirror = async () => {
    loadingText.value = "正在检测镜像源...";
    const endpoint = `${GITHUB_REPO_COMMUNITY}/releases/latest`;
    const testUrls = [`${GITHUB_API_BASE}${endpoint}`, ...MIRROR_URLS.map(m => `${m}/${GITHUB_API_BASE}${endpoint}`)];
    
    const results = await Promise.all(testUrls.map(url => 
        new Promise(resolve => {
            const start = performance.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal })
                .then(() => {
                    const timeTaken = performance.now() - start;
                    resolve({ url, timeTaken });
                })
                .catch(() => resolve({ url, timeTaken: Infinity }))
                .finally(() => clearTimeout(timeoutId));
        })
    ));

    const sortedResults = results.filter(result => result.timeTaken !== Infinity)
                                 .sort((a, b) => a.timeTaken - b.timeTaken);
    
    if (sortedResults.length > 0) {
        const fastestUrl = sortedResults[0].url;
        const mirrorMatch = fastestUrl.match(/^(https:\/\/[^/]+)/);
        return mirrorMatch ? mirrorMatch[1] : null;
    }
    return null;
};

// --- UI / 渲染逻辑 ---
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const renderMarkdown = (markdown) => {
  return markdown && typeof marked !== 'undefined'
      ? marked.parse(markdown)
      : `<p class="card-subtitle">没有提供更新日志。</p>`;
};

// --- 弹窗逻辑 ---
const showDownloadModal = (asset, isBeta) => {
  const originalUrl = asset.browser_download_url;
  const version = extractVersionFromUrl(originalUrl) || '最新版';
  const effectiveUrl = convertDownloadUrl(originalUrl, isBeta);

  downloadUrl.value = effectiveUrl;
  countdownValue.value = 5;
  manualDownloadTipVisible.value = false;

  downloadModalRef.value.showModal();

  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }

  countdownInterval.value = setInterval(() => {
    countdownValue.value--;
    if (countdownValue.value <= 0) {
      clearInterval(countdownInterval.value);
      const a = document.createElement('a');
      a.href = effectiveUrl;
      a.download = '';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      manualDownloadTipVisible.value = true;
    }
  }, 1000);
};

const closeModal = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
  downloadModalRef.value.close();
};

// --- 事件处理 ---
const toggleBeta = async () => {
  showingBeta.value = !showingBeta.value;
  loading.value = true;
  currentIndex.value = 0;
  
  if (showingBeta.value && releasesBeta.value.length === 0) {
    loadingText.value = "正在获取 Beta 版本...";
    const betaUrls = buildApiUrls(`${GITHUB_REPO_COMMUNITY_BETA}/releases`);
    const fetchedReleases = await fetchDataWithMirrors(betaUrls, "Beta 版本获取失败") || [];
    releasesBeta.value = fetchedReleases;
  }
  loading.value = false;
};

// --- 初始化 ---
onMounted(async () => {
  // 智教镜像检测
  loadingText.value = "正在检测智教镜像源...";
  smartTeachAvailable.value = await testSmartTeachAvailability();
  console.log(`智教镜像源可用: ${smartTeachAvailable.value}`);

  // GitHub镜像检测
  if (!smartTeachAvailable.value) {
    loadingText.value = "智教镜像不可用，正在检测GitHub镜像...";
    fastestMirror.value = await detectFastestMirror();
    console.log(`最快GitHub镜像源: ${fastestMirror.value || '无'}`);
  } else {
    loadingText.value = "智教镜像可用，将优先使用...";
  }

  // 获取正式版本发布
  loadingText.value = "正在获取正式版本...";
  const releaseUrls = buildApiUrls(`${GITHUB_REPO_COMMUNITY}/releases`);
  releasesOfficial.value = await fetchDataWithMirrors(releaseUrls, "正式版本获取失败") || [];
  
  loading.value = false;
});
</script>

<style scoped>
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

/* --- M3 Design Tokens --- */
:root {
  /* Color Palette (Light Theme) */
  --md-sys-color-primary: #0061a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #d1e4ff;
  --md-sys-color-on-primary-container: #001d36;
  --md-sys-color-secondary: #535f70;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #d7e3f7;
  --md-sys-color-on-secondary-container: #101c2b;
  --md-sys-color-tertiary: #6b5778;
  --md-sys-color-on-tertiary: #ffffff;
  --md-sys-color-tertiary-container: #f2daff;
  --md-sys-color-on-tertiary-container: #251431;
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-on-error-container: #410002;
  --md-sys-color-background: #fdfcff;
  --md-sys-color-on-background: #1a1c1e;
  --md-sys-color-surface: #fdfcff;
  --md-sys-color-on-surface: #1a1c1e;
  --md-sys-color-surface-variant: #dfe3eb;
  --md-sys-color-on-surface-variant: #42474e;
  --md-sys-color-outline: #73777f;
  --md-sys-color-outline-variant: #c2c7cf;
  --md-sys-color-shadow: #000000;
  --md-sys-color-surface-container-lowest: #ffffff;
  --md-sys-color-surface-container-low: #f7f9fc;
  --md-sys-color-surface-container: #f1f4f7;
  --md-sys-color-surface-container-high: #ebeef1;
  --md-sys-color-surface-container-highest: #e6e8eb;

  /* Typography */
  --md-sys-typescale-font-family: 'Noto Sans SC', sans-serif;
  --md-sys-typescale-display-large-size: 3.5625rem;
  --md-sys-typescale-display-medium-size: 2.8125rem;
  --md-sys-typescale-headline-large-size: 2rem;
  --md-sys-typescale-headline-medium-size: 1.75rem;
  --md-sys-typescale-title-large-size: 1.375rem;
  --md-sys-typescale-title-medium-size: 1rem;
  --md-sys-typescale-label-large-size: 0.875rem;
  --md-sys-typescale-body-large-size: 1rem;
  --md-sys-typescale-body-medium-size: 0.875rem;

  /* Transitions */
  --transition-duration: 0.3s;
  --transition-timing: ease-in-out;
}

:global(html.dark) {
  /* Color Palette (Dark Theme) */
  --md-sys-color-primary: #9ecaff;
  --md-sys-color-on-primary: #003258;
  --md-sys-color-primary-container: #00497d;
  --md-sys-color-on-primary-container: #d1e4ff;
  --md-sys-color-secondary: #bac7db;
  --md-sys-color-on-secondary: #253140;
  --md-sys-color-secondary-container: #3b4858;
  --md-sys-color-on-secondary-container: #d7e3f7;
  --md-sys-color-tertiary: #d6bee4;
  --md-sys-color-on-tertiary: #3b2948;
  --md-sys-color-tertiary-container: #523f5f;
  --md-sys-color-on-tertiary-container: #f2daff;
  --md-sys-color-error: #ffb4ab;
  --md-sys-color-on-error: #690005;
  --md-sys-color-error-container: #93000a;
  --md-sys-color-on-error-container: #ffdad6;
  --md-sys-color-background: #1a1c1e;
  --md-sys-color-on-background: #e2e2e6;
  --md-sys-color-surface: #1a1c1e;
  --md-sys-color-on-surface: #e2e2e6;
  --md-sys-color-surface-variant: #42474e;
  --md-sys-color-on-surface-variant: #c2c7cf;
  --md-sys-color-outline: #8c9199;
  --md-sys-color-outline-variant: #42474e;
  --md-sys-color-shadow: #000000;
  --md-sys-color-surface-container-lowest: #141619;
  --md-sys-color-surface-container-low: #1a1c1e;
  --md-sys-color-surface-container: #1e2022;
  --md-sys-color-surface-container-high: #282b2d;
  --md-sys-color-surface-container-highest: #333638;
}

/* --- Base & Reset --- */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:global(body) {
  font-family: var(--md-sys-typescale-font-family);
  background-color: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
  transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

/* --- Typography Classes --- */
.typescale-headline-large { font-size: var(--md-sys-typescale-headline-large-size); font-weight: 400; line-height: 2.5rem; }
.typescale-headline-small { font-size: 1.5rem; font-weight: 400; line-height: 2rem; }
.typescale-title-large { font-size: var(--md-sys-typescale-title-large-size); font-weight: 500; line-height: 1.75rem; }
.typescale-title-medium { font-size: var(--md-sys-typescale-title-medium-size); font-weight: 500; line-height: 1.5rem; }
.typescale-label-large { font-size: var(--md-sys-typescale-label-large-size); font-weight: 500; line-height: 1.25rem; }
.typescale-body-large { font-size: var(--md-sys-typescale-body-large-size); font-weight: 400; line-height: 1.5rem; }
.typescale-body-medium { font-size: var(--md-sys-typescale-body-medium-size); font-weight: 400; line-height: 1.25rem; letter-spacing: 0.017em;}
.typescale-body-small { font-size: 0.75rem; font-weight: 400; line-height: 1rem; }

/* --- Components --- */

/* Button */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.5rem; /* 40px */
    padding: 0 1.5rem;
    border-radius: 6.25rem; /* 100px */
    border: 1px solid transparent;
    font-size: var(--md-sys-typescale-label-large-size);
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing), box-shadow var(--transition-duration) var(--transition-timing), transform var(--transition-duration) var(--transition-timing);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
.btn:hover {
    box-shadow: 0 1px 3px 1px rgba(0,0,0,0.15);
}
.btn:active {
    transform: scale(0.98);
}
.btn--filled {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
}
.btn--filled:hover { background-color: color-mix(in srgb, var(--md-sys-color-primary), white 8%); }
.btn--tonal {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
}
.btn--tonal:hover { background-color: color-mix(in srgb, var(--md-sys-color-secondary-container), white 8%);}
.btn--text {
    height: auto;
    padding: 0.5rem 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    background-color: transparent;
}
.btn--text:hover { background-color: color-mix(in srgb, var(--md-sys-color-on-surface), transparent 88%); box-shadow: none; }
.btn--icon {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    font-size: 1.5rem;
    color: var(--md-sys-color-on-surface-variant);
    background-color: transparent;
}
.btn--icon:hover { background-color: color-mix(in srgb, var(--md-sys-color-on-surface), transparent 88%); box-shadow: none; }
.btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  box-shadow: none;
}
.btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* Card */
.card {
    border-radius: 1.5rem;
    padding: 1.5rem;
    transition: background-color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing), transform var(--transition-duration) var(--transition-timing);
}
.card--filled {
    background-color: var(--md-sys-color-surface-container-high);
}
.card-subtitle {
    color: var(--md-sys-color-on-surface-variant);
}

/* Chip */
.chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    height: 2rem;
    padding: 0 0.75rem;
    border-radius: 2rem;
    font-size: var(--md-sys-typescale-label-large-size);
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
}
.chip--small {
    height: 1.5rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
}

/* --- Sections --- */

/* Release Section */
.release-info {
    margin: 4rem 0;
}
.release-item-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
.release-item-actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}
.release-item + .release-item { margin-top: 1rem; }

/* Other components */
.status-chip {
  margin-bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  gap: 0.5rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}
.smart-teach-chip {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
.mirror-chip {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}
.error-chip {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

/* 下载按钮中的文本溢出处理 */
.btn--tonal span {
  display: inline-block;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.btn--tonal .material-symbols-outlined {
  flex-shrink: 0;
}

/* Markdown 样式覆盖 */
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) {
  font-family: var(--md-sys-typescale-font-family);
  font-weight: 500;
  color: var(--md-sys-color-on-background);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.markdown-body :deep(h1) { font-size: var(--md-sys-typescale-headline-medium-size); }
.markdown-body :deep(h2) { font-size: var(--md-sys-typescale-title-large-size); }
.markdown-body :deep(h3) { font-size: var(--md-sys-typescale-title-medium-size); }
.markdown-body :deep(p) {
  font-family: var(--md-sys-typescale-font-family);
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 1rem;
}
.markdown-body :deep(ul) {
  padding-left: 20px;
}

/* 通用布局与组件 */
.download-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-font-family);
}
.divider {
  border-top: 1px solid var(--md-sys-color-outline-variant);
  margin-block: 0.5rem;
}
.btn-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}
.loader {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: inline-block;
    border: 4px solid var(--md-sys-color-surface-variant);
    border-top: 4px solid var(--md-sys-color-primary);
    animation: spin 1s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.release-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 0;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  border: none;
  border-radius: 1.5rem;
  padding: 0;
}
.modal[open] {
  opacity: 1;
  visibility: visible;
}
.modal-content {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border-radius: 1.5rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0.75rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}
.modal-body {
  padding: 0 1.5rem;
}
.countdown-container {
  margin-top: 1rem;
  text-align: center;
}
.countdown-number {
  color: var(--md-sys-color-primary);
  font-weight: 500;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.5rem;
}
@media (max-width: 480px) {
  .modal-content {
    margin: 0 1rem;
  }
}

/* 新增的样式 */
.header-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.release-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  justify-items: start;
}
@media (min-width: 768px) {
  .release-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 900px;
    margin: 0;
  }
}
@media (min-width: 1200px) {
  .release-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 1000px;
    margin: 0;
  }
}
</style>
