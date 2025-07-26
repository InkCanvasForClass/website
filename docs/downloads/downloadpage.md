# InkCanvasForClass 下载中心

<div class="download-container">
  <div class="version-selector">
    <button id="stableBtn" class="active">正式版</button>
    <button id="betaBtn">测试版</button>
  </div>
  
  <div class="version-info">
    <h2>当前版本: <span id="currentVersion">检测中...</span></h2>
    <p id="versionDesc"></p>
  </div>
  
  <div class="download-button">
    <button id="downloadBtn">下载最新版本</button>
  </div>
  
  <div class="loading" id="loadingIndicator">
    <div class="spinner"></div>
    <p>正在检测最新版本...</p>
  </div>
</div>

<script>
(function() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', function() {
    const stableBtn = document.getElementById('stableBtn');
    const betaBtn = document.getElementById('betaBtn');
    const currentVersion = document.getElementById('currentVersion');
    const versionDesc = document.getElementById('versionDesc');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!stableBtn || !betaBtn || !currentVersion || !versionDesc || !downloadBtn || !loadingIndicator) {
      console.error('无法找到必要的DOM元素');
      return;
    }
    
    // 仓库信息
    const repos = {
      stable: {
        owner: 'InkCanvasForClass',
        repo: 'community',
        versionFile: 'AutomaticUpdateVersionControl.txt'
      },
      beta: {
        owner: 'InkCanvasForClass',
        repo: 'community-beta',
        versionFile: 'AutomaticUpdateVersionControl.txt'
      }
    };
    
    // 版本文件URL
    const versionUrls = {
      stable: `https://bgithub.xyz/InkCanvasForClass/community/raw/refs/heads/main/AutomaticUpdateVersionControl.txt`,
      beta: `https://bgithub.xyz/InkCanvasForClass/community-beta/raw/refs/heads/main/AutomaticUpdateVersionControl.txt`
    };
    
    // 下载链接模板
    const downloadTemplates = {
      stable: 'https://bgithub.xyz/InkCanvasForClass/community/releases/download/{version}/InkCanvasForClass.CE.{version}.zip',
      beta: 'https://bgithub.xyz/InkCanvasForClass/community-beta/releases/download/{version}/InkCanvasForClass.CE.{version}.zip'
    };
    
    let currentChannel = 'stable';
    let latestVersion = '';
    
    // 可选的获取方法
    const fetchMethods = {
      API: 'github_api',
      FILE: 'version_file',
      PROXY: 'cors_proxy'
    };
    
    // 设置初始获取方法 - 可以改为您偏好的方法
    let preferredMethod = fetchMethods.API;
    
    // 初始加载正式版信息
    fetchVersionInfo('stable', preferredMethod);
    
    // 切换版本通道
    stableBtn.addEventListener('click', function() {
      if (currentChannel !== 'stable') {
        currentChannel = 'stable';
        stableBtn.classList.add('active');
        betaBtn.classList.remove('active');
        fetchVersionInfo('stable', preferredMethod);
      }
    });
    
    betaBtn.addEventListener('click', function() {
      if (currentChannel !== 'beta') {
        currentChannel = 'beta';
        betaBtn.classList.add('active');
        stableBtn.classList.remove('active');
        fetchVersionInfo('beta', preferredMethod);
      }
    });
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', function() {
      if (latestVersion) {
        const downloadUrl = downloadTemplates[currentChannel].replace(/{version}/g, latestVersion);
        window.location.href = downloadUrl;
      }
    });
    
    // 选择并执行版本获取方法
    function fetchVersionInfo(channel, method) {
      currentVersion.textContent = '检测中...';
      versionDesc.textContent = '';
      loadingIndicator.style.display = 'flex';
      downloadBtn.disabled = true;
      
      console.log(`使用${method}方法获取${channel}通道的版本信息...`);
      
      if (method === fetchMethods.API) {
        getLatestReleaseFromGitHub(channel);
      } else if (method === fetchMethods.FILE) {
        checkVersionFromFile(channel);
      } else {
        tryAlternativeCorsProxy(channel);
      }
    }
    
    
    // 使用硬编码的备用数据
    function useFallbackData(channel) {
      console.log('所有网络请求失败，使用备用数据...');
      loadingIndicator.style.display = 'none';
      
      if (channel === 'stable') {
        latestVersion = '1.7.3.0';
        currentVersion.textContent = latestVersion;
        versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
      } else {
        latestVersion = '1.7.3.0';
        currentVersion.textContent = latestVersion;
        versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
      }
      
      downloadBtn.disabled = false;
    }
  });
})();
</script>

<style>
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

.download-button button:hover {
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
html.dark .version-selector button {
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
