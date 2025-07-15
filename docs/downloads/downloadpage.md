# InkCanvasForClass 下载中心

<div class="download-wrapper">
  <!-- 主内容区 -->
  <div class="main-content">
    <!-- 版本选择器 -->
    <div class="version-tabs">
      <button id="stableBtn" class="version-tab active">正式版</button>
      <button id="betaBtn" class="version-tab">测试版</button>
    </div>

    <!-- 版本信息展示 -->
    <div class="version-display">
      <h2>当前版本: <span id="currentVersion" class="version-number">检测中...</span></h2>
      <p id="versionDesc" class="version-description"></p>
    </div>

    <!-- 下载按钮 -->
    <div class="download-action">
      <button id="downloadBtn" class="primary-btn" disabled>下载最新版本</button>
    </div>

    <!-- 加载指示器 -->
    <div id="loadingIndicator" class="loading-indicator">
      <div class="spinner"></div>
      <p>正在检测最新版本...</p>
    </div>
  </div>

  <!-- 备选下载区 -->
  <div class="alternative-downloads">
    <h3 class="section-title">其他下载地址</h3>
    
    <div class="download-section">
      <h4>正式版下载</h4>
      <select class="download-select" onchange="if(this.value) window.location.href=this.value">
        <option value="">选择下载地址...</option>
        <option value="https://cjk-mkp.lanzouw.com/b004imjaej">蓝奏云一 (密码55ah)</option>
        <option value="https://www.ilanzou.com/s/DLYZ827G">蓝奏云二</option>
        <option value="https://docs.qq.com/aio/DR0JXWGVNTUVkZ1F6?no_promotion=1&p=oeqq176WTz8M9AuuJUdRDV&_t=1752559307913&nlc=1&u=4a48533a5c554ac19bde80b8b4536db0">腾讯文档</option>
      </select>
    </div>
    
    <div class="download-section">
      <h4>测试版下载</h4>
      <select class="download-select" onchange="if(this.value) window.location.href=this.value">
        <option value="">选择下载地址...</option>
        <option value="https://cjk-mkp.lanzouw.com/b004imjafa">蓝奏云一 (密码b3ts)</option>
        <option value="https://www.ilanzou.com/s/IrPZ82Le">蓝奏云二</option>
        <option value="https://docs.qq.com/aio/DR0JXWGVNTUVkZ1F6?no_promotion=1&p=p2y1Tvbd3fS4In3WMECHKW&_t=1752559307913&nlc=1&u=4a48533a5c554ac19bde80b8b4536db0">腾讯文档</option>
        <option value="https://github.com/InkCanvasForClass/community/actions">GitHub Action</option>
      </select>
    </div>
  </div>
</div>

<style>
/* 基础样式重置与变量定义 */
:root {
  --primary-color: #42b983;
  --primary-dark: #359e75;
  --bg-light: #ffffff;
  --bg-soft: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

html.dark {
  --primary-color: #4fc08d;
  --primary-dark: #38a169;
  --bg-light: #1a1a1a;
  --bg-soft: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #bbbbbb;
  --border-color: #444444;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 主容器布局 */
.download-wrapper {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  padding: 0 1rem;
}

/* 主内容区样式 */
.main-content {
  background: var(--bg-light);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 版本选择器样式 */
.version-tabs {
  display: flex;
  gap: 0.5rem;
}

.version-tab {
  padding: 0.75rem 1.5rem;
  background: var(--bg-soft);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: var(--transition);
  color: var(--text-primary);
}

.version-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.version-tab:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 版本信息展示 */
.version-display {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.version-number {
  color: var(--primary-color);
  font-weight: bold;
}

.version-description {
  color: var(--text-secondary);
  margin-top: 0.5rem;
  font-size: 0.95rem;
}

/* 下载按钮样式 */
.download-action {
  padding: 1rem 0;
}

.primary-btn {
  padding: 1rem 2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.primary-btn:disabled {
  background: var(--border-color);
  cursor: not-allowed;
  transform: none;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--text-secondary);
  padding: 1rem 0;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 备选下载区样式 */
.alternative-downloads {
  background: var(--bg-soft);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  align-self: start;
}

.section-title {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 1.2rem;
}

.download-section {
  margin-bottom: 1.5rem;
}

.download-section h4 {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.download-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-light);
  color: var(--text-primary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition);
}

.download-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .download-wrapper {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 1.5rem;
  }
  
  .version-tabs {
    flex-wrap: wrap;
  }
  
  .primary-btn {
    width: 100%;
    justify-content: center;
  }
}

/* 无障碍访问优化 */
.version-tab:focus,
.primary-btn:focus,
.download-select:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>

<script>
(function() {
  // 版本通道配置
  const versionConfig = {
    stable: {
      versionUrl: 'https://raw.githubusercontent.com/InkCanvasForClass/community/main/versions/stable.txt',
      downloadTemplate: 'https://github.com/InkCanvasForClass/community/releases/download/v{version}/ICC-CE_v{version}.exe',
      fallbackVersion: '1.7.0.0',
      description: '这是稳定的正式发布版本，适合日常教学使用。'
    },
    beta: {
      versionUrl: 'https://raw.githubusercontent.com/InkCanvasForClass/community/main/versions/beta.txt',
      downloadTemplate: 'https://github.com/InkCanvasForClass/community/releases/download/v{version}-beta/ICC-CE_v{version}-beta.exe',
      fallbackVersion: '1.7.0.5',
      description: '这是测试版本，包含最新功能，但可能存在不稳定因素。'
    }
  };
  
  // DOM元素
  const elements = {
    stableBtn: document.getElementById('stableBtn'),
    betaBtn: document.getElementById('betaBtn'),
    currentVersion: document.getElementById('currentVersion'),
    versionDesc: document.getElementById('versionDesc'),
    downloadBtn: document.getElementById('downloadBtn'),
    loadingIndicator: document.getElementById('loadingIndicator')
  };
  
  // 状态管理
  let state = {
    currentChannel: 'stable',
    latestVersion: '',
    isLoading: true
  };
  
  // 初始化
  function init() {
    bindEvents();
    checkLatestVersion(state.currentChannel);
  }
  
  // 事件绑定
  function bindEvents() {
    elements.stableBtn.addEventListener('click', () => switchChannel('stable'));
    elements.betaBtn.addEventListener('click', () => switchChannel('beta'));
    elements.downloadBtn.addEventListener('click', downloadLatestVersion);
  }
  
  // 切换版本通道
  function switchChannel(channel) {
    if (channel === state.currentChannel) return;
    
    // 更新状态
    state.currentChannel = channel;
    state.latestVersion = '';
    state.isLoading = true;
    
    // 更新UI
    elements.stableBtn.classList.toggle('active', channel === 'stable');
    elements.betaBtn.classList.toggle('active', channel === 'beta');
    elements.currentVersion.textContent = '检测中...';
    elements.versionDesc.textContent = '';
    elements.downloadBtn.disabled = true;
    elements.loadingIndicator.style.display = 'flex';
    
    // 检查版本
    checkLatestVersion(channel);
  }
  
  // 检查最新版本
  function checkLatestVersion(channel) {
    // 先尝试GitHub API
    fetchGitHubAPI(channel)
      .catch(() => {
        // API失败尝试直接获取版本文件
        return fetchVersionFile(channel, 'https://corsproxy.io/?')
          .catch(() => {
            // 第一个代理失败尝试第二个
            return fetchVersionFile(channel, 'https://cors-anywhere.herokuapp.com/')
              .catch(() => {
                // 所有尝试失败使用备用数据
                useFallbackVersion(channel);
                throw new Error('所有获取方式失败');
              });
          });
      });
  }
  
  // 从GitHub API获取版本
  function fetchGitHubAPI(channel) {
    const apiUrl = channel === 'stable'
      ? 'https://api.github.com/repos/InkCanvasForClass/community/releases/latest'
      : 'https://api.github.com/repos/InkCanvasForClass/community/releases';
      
    return fetch(apiUrl)
      .then(response => {
        if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
        return response.json();
      })
      .then(data => {
        let versionData;
        if (channel === 'beta') {
          // 测试版取最新预发布版本
          versionData = data.find(release => release.prerelease) || data[0];
        } else {
          versionData = data;
        }
        
        if (!versionData) throw new Error('未找到版本信息');
        
        // 解析版本号
        state.latestVersion = versionData.tag_name.replace('v', '').replace('-beta', '');
        updateVersionUI(channel);
      });
  }
  
  // 从版本文件获取版本
  function fetchVersionFile(channel, proxy) {
    const config = versionConfig[channel];
    const targetUrl = encodeURIComponent(config.versionUrl);
    
    return fetch(`${proxy}${targetUrl}`)
      .then(response => {
        if (!response.ok) throw new Error(`网络错误: ${response.status}`);
        return response.text();
      })
      .then(data => {
        // 解析版本号
        const version = data.trim().split('\n')[0].replace('v', '');
        if (!version) throw new Error('版本号解析失败');
        
        state.latestVersion = version;
        updateVersionUI(channel);
      });
  }
  
  // 使用备用版本数据
  function useFallbackVersion(channel) {
    const config = versionConfig[channel];
    state.latestVersion = config.fallbackVersion;
    updateVersionUI(channel);
  }
  
  // 更新版本信息UI
  function updateVersionUI(channel) {
    state.isLoading = false;
    const config = versionConfig[channel];
    
    elements.loadingIndicator.style.display = 'none';
    elements.currentVersion.textContent = state.latestVersion;
    elements.versionDesc.textContent = config.description;
    elements.downloadBtn.disabled = false;
  }
  
  // 下载最新版本
  function downloadLatestVersion() {
    if (!state.latestVersion) {
      alert('无法获取最新版本信息，请尝试其他下载方式');
      return;
    }
    
    const config = versionConfig[state.currentChannel];
    const downloadUrl = config.downloadTemplate.replace(/{version}/g, state.latestVersion);
    window.open(downloadUrl, '_blank');
  }
  
  // 初始化执行
  init();
})();
</script>

## 下载说明

- **正式版**：经过充分测试，稳定可靠，适合日常教学场景使用
- **测试版**：包含最新开发的功能，可能存在未知问题，适合想要体验新功能的用户
- 所有版本均基于 [GPLv3 许可证](https://www.gnu.org/licenses/gpl-3.0.html) 发布，确保用户拥有自由使用和修改的权利

如果您在下载或使用过程中遇到问题，请参考 [故障排除指南](/guide/troubleshooting) 或在 [GitHub Issues](https://github.com/InkCanvasForClass/community/issues) 提交问题反馈。
