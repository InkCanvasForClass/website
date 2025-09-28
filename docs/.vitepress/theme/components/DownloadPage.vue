<template>
  <div class="download-container">
    <div class="version-selector">
      <button :class="{ active: currentChannel === 'stable' }" @click="selectChannel('stable')">
        正式版
      </button>
      <button :class="{ active: currentChannel === 'beta' }" @click="selectChannel('beta')">
        测试版
      </button>
    </div>

    <div class="loading" v-if="isLoading">
      <div class="spinner"></div>
      <p>正在检测版本信息...</p>
    </div>

    <div v-else>
      <div class="history-selector" v-if="releasesHistory.length > 0">
        <label for="version-select">选择版本:</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select id="version-select" v-model="selectedVersionTag" @change="updateVersionDetails">
            <option v-for="release in releasesHistory" :key="release.id" :value="release.tag_name">
              {{ release.tag_name }} {{ release.prerelease ? '(Pre-release)' : '' }}
            </option>
          </select>
          <div class="download-button">
            <button @click="downloadFile" :disabled="!versionInfo.downloadUrl">
              下载
            </button>
          </div>
        </div>
      </div>

      <div class="version-info">
        <h2>当前版本: <span>{{ versionInfo.version }}</span></h2>
        <p>{{ versionInfo.description }}</p>

        <div class="release-notes" v-if="versionInfo.releaseNotes">
          <h3>更新说明:</h3>
          <div v-html="versionInfo.releaseNotes"></div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showThankYouModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <button class="modal-close" @click="closeModal" aria-label="关闭弹窗">&times;</button>
          <h2>感谢您的下载！</h2>
          <p>您的文件将在 <strong>{{ countdown }}</strong> 秒后开始自动下载。</p>
          <p v-if="manualDownloadTipVisible" style="margin-top:0.5rem;">若未开始，请使用下方手动下载：</p>
          <div style="margin:0.75rem 0; display:flex; gap:0.5rem; justify-content:center; align-items:center;">
            <a v-if="manualDownloadUrl" :href="manualDownloadUrl" @click.prevent="onManualDownload" class="download-link" style="padding:8px 14px; background:var(--vp-c-brand,#0078d4); color:white; border-radius:4px; text-decoration:none;">手动下载</a>
            <button @click="closeModal" style="padding:8px 12px; border-radius:4px; background:transparent; border:1px solid var(--vp-c-border,#ccc);">关闭</button>
          </div>
          <p style="margin-top:0.5rem;">如果遇到任何问题，请通过社区或 GitHub Issues 联系我们。</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { marked } from 'marked';

// --- 响应式状态定义 ---
const currentChannel = ref('stable');
const isLoading = ref(true);
const releasesHistory = ref([]);
const selectedVersionTag = ref('');
const showThankYouModal = ref(false); // 新增: 控制弹窗显示

const versionInfo = reactive({
  version: '检测中...',
  description: '',
  releaseNotes: '',
  downloadUrl: ''
});

// --- API 和配置 ---
const apiConfig = {
  stable: {
    repo: 'InkCanvasForClass/community',
    description: '这是稳定的正式发布版本，适合日常使用。'
  },
  beta: {
    repo: 'InkCanvasForClass/community-beta',
    description: '这是测试版本，包含最新功能，但可能不稳定。'
  }
};

const downloadTemplates = {
  stable: 'https://github.com/InkCanvasForClass/community/releases/download/{version}/InkCanvasForClass.CE.{version}.zip',
  beta: 'https://github.com/InkCanvasForClass/community-beta/releases/download/{version}/InkCanvasForClass.CE.{version}.zip'
};

// --- 新增：镜像与国内优先相关常量与状态 ---
const SMART_TEACH_DOMAIN = 'https://get.smart-teach.cn';
const COMMUNITY_PATH = '/d/Ningbo-S3/shared/jiangling/community';
const COMMUNITY_BETA_PATH = '/d/Ningbo-S3/shared/jiangling/community-beta';
const GITHUB_API_BASE = 'https://api.github.com/repos/';
const MIRROR_URLS = [
  'https://gh.llkk.cc',
  'https://ghfile.geekertao.top',
  'https://gh.dpik.top',
  'https://github.dpik.top',
  'https://github.acmsz.top',
  'https://git.yylx.win'
];

let fastestMirror = null;
let smartTeachAvailable = false;

// --- 方法定义 ---

const selectChannel = (channel) => {
  if (currentChannel.value !== channel) {
    currentChannel.value = channel;
    releasesHistory.value = [];
    selectedVersionTag.value = '';
    fetchAllReleases(channel);
  }
};

const fetchAllReleases = async (channel) => {
  isLoading.value = true;
  const config = apiConfig[channel];

  try {
    // 构建候选 API URL 列表并尝试
    const urls = buildApiUrls(`${config.repo}/releases`);
    const releases = await fetchDataWithMirrors(urls, '未能获取版本列表');
    if (releases && releases.length > 0) {
      releasesHistory.value = releases;
      selectedVersionTag.value = releases[0].tag_name;
      updateVersionDetails();
    } else {
      throw new Error('未找到任何发布版本。');
    }
  } catch (error) {
    console.error('获取版本列表失败:', error);
    useFallbackData(channel);
  } finally {
    isLoading.value = false;
  }
};

const updateVersionDetails = () => {
  const selectedRelease = releasesHistory.value.find(
    release => release.tag_name === selectedVersionTag.value
  );

  if (!selectedRelease) return;

  const config = apiConfig[currentChannel.value];
  versionInfo.version = selectedRelease.tag_name;
  versionInfo.description = config.description;
  versionInfo.releaseNotes = selectedRelease.body ? marked.parse(selectedRelease.body) : '';

  const asset = selectedRelease.assets.find(asset =>
    asset.name.includes('InkCanvasForClass.CE') && asset.name.endsWith('.zip')
  );

  if (asset) {
    versionInfo.downloadUrl = convertDownloadUrl(asset.browser_download_url, currentChannel.value === 'beta');
  } else {
    const rawUrl = downloadTemplates[currentChannel.value].replace(/{version}/g, selectedRelease.tag_name);
    versionInfo.downloadUrl = convertDownloadUrl(rawUrl, currentChannel.value === 'beta');
  }
};

const useFallbackData = (channel) => {
  console.log('GitHub API 请求失败，使用备用数据...');
  releasesHistory.value = [];
  const fallbackData = {
    stable: { version: '1.7.3.0', desc: '这是稳定的正式发布版本，适合日常使用。' },
    beta: { version: '1.7.3.0', desc: '这是测试版本，包含最新功能，但可能不稳定。' }
  };

  const data = fallbackData[channel];
  versionInfo.version = data.version;
  versionInfo.description = data.desc;
  versionInfo.releaseNotes = '';
  versionInfo.downloadUrl = downloadTemplates[channel].replace(/{version}/g, data.version);
};

const parseMarkdown = (text) => {
  return marked.parse(text);
};

// --- 新增：倒计时与手动下载相关状态（修复 ReferenceError） ---
const countdown = ref(5);
const manualDownloadUrl = ref('');
const manualDownloadTipVisible = ref(false);
// 计时器句柄（非响应式）
let countdownTimer = null;

/**
 * 下载按钮点击事件处理, 启动弹窗倒计时并在倒计时结束后自动下载
 */
const downloadFile = () => {
  if (versionInfo.downloadUrl) {
    // 准备弹窗与倒计时
    manualDownloadUrl.value = versionInfo.downloadUrl;
    manualDownloadTipVisible.value = false;
    countdown.value = 5;
    showThankYouModal.value = true;

    // 清理旧计时器
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    // 启动倒计时
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        // 自动触发下载
        try {
          const a = document.createElement('a');
          a.href = manualDownloadUrl.value;
          a.download = '';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.error('自动下载触发失败:', e);
        }
        // 显示手动下载提示
        manualDownloadTipVisible.value = true;
      }
    }, 1000);
  }
};

/**
 * 手动下载处理：停止倒计时并立即下载，然后关闭弹窗
 */
const onManualDownload = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (manualDownloadUrl.value) {
    const a = document.createElement('a');
    a.href = manualDownloadUrl.value;
    a.download = '';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  showThankYouModal.value = false;
};

/**
 * 关闭弹窗时清理计时器
 */
const closeModal = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  showThankYouModal.value = false;
};

// --- 新增：构建 API 请求候选 URL 列表（优先最快镜像） ---
const buildApiUrls = (endpoint) => {
  const unique = new Set();
  if (fastestMirror) unique.add(`${fastestMirror}/${GITHUB_API_BASE}${endpoint}`);
  unique.add(`${GITHUB_API_BASE}${endpoint}`);
  MIRROR_URLS.forEach(m => unique.add(`${m}/${GITHUB_API_BASE}${endpoint}`));
  return Array.from(unique);
};

// --- 新增：测试智教镜像是否可用 ---
const testSmartTeachAvailability = async () => {
  try {
    const testUrl = `${SMART_TEACH_DOMAIN}${COMMUNITY_PATH}/test.txt`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(testUrl, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    return res && (res.status === 200 || res.status < 400);
  } catch (e) {
    return false;
  }
};

// --- 新增：将 GitHub 下载 URL 转为智教或镜像 URL（优先智教，特殊处理 .exe） ---
const buildSmartTeachUrl = (url, isBeta = false) => {
  const fileName = url.split('/').pop();
  const basePath = isBeta ? COMMUNITY_BETA_PATH : COMMUNITY_PATH;
  return `${SMART_TEACH_DOMAIN}${basePath}/${fileName}`;
};

const convertDownloadUrl = (url, isBeta = false) => {
  if (!url) return url;
  // .exe 强制走镜像（不通过智教）
  if (url.endsWith('.exe')) {
    if (fastestMirror && url.startsWith('https://github.com/')) {
      return url.replace('https://github.com/', `${fastestMirror}/https://github.com/`);
    }
    return url;
  }
  // 非 .exe：智教优先
  if (smartTeachAvailable) return buildSmartTeachUrl(url, isBeta);
  if (fastestMirror && url.startsWith('https://github.com/')) {
    return url.replace('https://github.com/', `${fastestMirror}/https://github.com/`);
  }
  return url;
};

// --- 新增：按候选 URL 列表尝试获取数据 ---
const fetchDataWithMirrors = async (urls, errorMessage = '获取数据失败') => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return await res.json();
      console.log(`镜像尝试失败: ${url}, status: ${res.status}`);
    } catch (e) {
      console.log(`镜像尝试失败: ${url}, error: ${e.message}`);
    }
  }
  console.error(errorMessage);
  return null;
};

// --- 新增：检测最快镜像（HEAD 请求测时长） ---
const detectFastestMirror = async () => {
  const endpoint = `${apiConfig.stable.repo}/releases/latest`;
  const testUrls = [`${GITHUB_API_BASE}${endpoint}`, ...MIRROR_URLS.map(m => `${m}/${GITHUB_API_BASE}${endpoint}`)];
  const results = await Promise.all(testUrls.map(u => new Promise(resolve => {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    fetch(u, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
      .then(() => resolve({ url: u, time: performance.now() - start }))
      .catch(() => resolve({ url: u, time: Infinity }))
      .finally(() => clearTimeout(timeoutId));
  })));
  const ok = results.filter(r => r.time !== Infinity).sort((a, b) => a.time - b.time);
  return ok.length > 0 ? ok[0].url : null;
};

// --- 生命周期钩子：先检测智教与镜像，再拉取 releases ---
onMounted(async () => {
  // 1. 检查智教镜像可用性
  smartTeachAvailable = await testSmartTeachAvailability();
  if (!smartTeachAvailable) {
    // 2. 智教不可用则检测最快镜像
    fastestMirror = await detectFastestMirror();
  }
  // 3. 请求默认通道
  fetchAllReleases('stable');
});
</script>

<style scoped>
/* --- 新增的弹窗样式 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: var(--vp-c-bg-soft, white);
  color: var(--vp-c-text-1, black);
  padding: 30px 40px;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
  width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

html.dark .modal-content {
  background: var(--bg-soft-dark, #222);
  color: var(--text-color-dark, white);
}

.modal-content h2 {
  margin-top: 0;
  color: var(--vp-c-brand, #0078d4);
}

.modal-content p {
  margin-bottom: 10px;
  line-height: 1.6;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  border: none;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: var(--vp-c-text-2, #666);
  padding: 0;
}

html.dark .modal-close {
  color: var(--vp-c-text-dark-2, #aaa);
}

/* 弹窗过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* --- 原有样式 --- */
.history-selector {
  margin-bottom: 20px;
}

.history-selector label {
  margin-right: 10px;
  font-weight: bold;
  color: var(--vp-c-text, var(--text-color-light));
}

.history-selector select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-border, var(--border-color-light));
  background: var(--vp-c-bg-soft, var(--bg-soft-light));
  color: var(--vp-c-text, var(--text-color-light));
  font-size: 16px;
  cursor: pointer;
}

html.dark .history-selector label,
html.dark .history-selector select {
  background: var(--bg-soft-dark);
  border-color: var(--border-color-dark);
  color: var(--text-color-dark);
}

:root {
  --text-color-light: #333;
  --text-color-dark: #ffffff;
  --bg-soft-light: #f9f9f9;
  --bg-soft-dark: #222;
  --border-color-light: #ccc;
  --border-color-dark: #444;
}

.download-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: var(--vp-font-family-base, "Segoe UI", Arial, sans-serif);
}

.version-selector {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.version-selector button {
  padding: 10px 20px;
  border: 1px solid var(--vp-c-border, var(--border-color-light));
  background: var(--vp-c-bg-soft, var(--bg-soft-light));
  color: var(--vp-c-text, var(--text-color-light));
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.3s;
}

.version-selector button.active {
  background: var(--vp-c-brand, #0078d4);
  color: var(--vp-c-white, white);
  border-color: var(--vp-c-brand, #0078d4);
}

.version-info {
  margin-bottom: 30px;
  padding: 15px;
  background: var(--vp-c-bg-soft, var(--bg-soft-light));
  border-radius: 4px;
  border-left: 4px solid var(--vp-c-brand, #0078d4);
  color: var(--vp-c-text, var(--text-color-light));
}

.release-notes {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--vp-c-border, var(--border-color-light));
}

.release-notes h3 {
  margin: 0 0 10px 0;
  color: var(--vp-c-brand, #0078d4);
}

:deep(.release-notes h4) {
  margin: 10px 0 5px 0;
  font-size: 14px;
}

:deep(.release-notes ul) {
  margin: 5px 0;
  padding-left: 20px;
}

.download-button button {
  padding: 10px 20px;
  background: var(--vp-c-brand, #0078d4);
  color: var(--vp-c-white, white);
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.download-button button:hover:not(:disabled) {
  background: var(--vp-c-brand-dark, #005a9e);
}

.download-button button:disabled {
  background: var(--vp-c-gray, #ccc);
  cursor: not-allowed;
  opacity: 0.7;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  color: var(--vp-c-text-2, #666);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--vp-c-brand, #0078d4);
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

html.dark .version-info,
html.dark .version-selector button,
html.dark .release-notes {
  color: var(--text-color-dark);
}

html.dark .version-info {
  background: var(--bg-soft-dark);
  border-left-color: var(--vp-c-brand, #0078d4);
}

html.dark .version-selector button {
  background: var(--bg-soft-dark);
  border-color: var(--border-color-dark);
}

html.dark .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--vp-c-brand, #0078d4);
}

html.dark .loading {
  color: var(--text-color-dark);
}

html.dark h2,
html.dark p {
  color: var(--text-color-dark);
}
</style>