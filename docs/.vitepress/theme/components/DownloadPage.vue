<template>
  <div class="download-container">
    <div class="version-selector">
      <button 
        :class="{ active: currentChannel === 'stable' }" 
        @click="selectChannel('stable')">
        正式版
      </button>
      <button 
        :class="{ active: currentChannel === 'beta' }" 
        @click="selectChannel('beta')">
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
        <select id="version-select" v-model="selectedVersionTag" @change="updateVersionDetails">
          <option v-for="release in releasesHistory" :key="release.id" :value="release.tag_name">
            {{ release.tag_name }} {{ release.prerelease ? '(Pre-release)' : '' }}
          </option>
        </select>
      </div>

      <div class="version-info">
        <h2>当前版本: <span>{{ versionInfo.version }}</span></h2>
        <p>{{ versionInfo.description }}</p>
        
        <div class="release-notes" v-if="versionInfo.releaseNotes">
          <h3>更新说明:</h3>
          <div v-html="versionInfo.releaseNotes"></div>
        </div>
      </div>
      
      <div class="download-button">
        <button @click="downloadFile" :disabled="!versionInfo.downloadUrl">
          下载所选版本 ({{ versionInfo.version }})
        </button>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showThankYouModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <button class="modal-close" @click="closeModal" aria-label="关闭弹窗">&times;</button>
          <h2>感谢您的下载！</h2>
          <p>您的文件应该已经开始下载了。如果遇到任何问题，请随时通过社区或 GitHub Issues 联系我们。</p>
          <p>祝您使用愉快！</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

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
    const response = await fetch(`https://api.github.com/repos/${config.repo}/releases`);
    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status}`);
    }
    const releases = await response.json();
    
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
  versionInfo.releaseNotes = selectedRelease.body ? parseMarkdown(selectedRelease.body) : '';
  
  const asset = selectedRelease.assets.find(asset =>
    asset.name.includes('InkCanvasForClass.CE') && asset.name.endsWith('.zip')
  );
  
  if (asset) {
    versionInfo.downloadUrl = asset.browser_download_url;
  } else {
    versionInfo.downloadUrl = downloadTemplates[currentChannel.value].replace(/{version}/g, selectedRelease.tag_name);
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
  return text
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/# (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/- (.*)/g, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
};

/**
 * 下载按钮点击事件处理, 并在之后显示弹窗
 */
const downloadFile = () => {
  if (versionInfo.downloadUrl) {
    window.open(versionInfo.downloadUrl, '_blank');
    showThankYouModal.value = true; // 显示弹窗
  }
};

/**
 * 新增: 关闭弹窗的方法
 */
const closeModal = () => {
  showThankYouModal.value = false;
};

// --- 生命周期钩子 ---
onMounted(() => {
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
  padding: 12px 30px;
  background: var(--vp-c-brand, #0078d4);
  color: var(--vp-c-white, white);
  border: none;
  border-radius: 4px;
  font-size: 18px;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
