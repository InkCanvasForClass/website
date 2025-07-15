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
    
    // 版本信息 - 由于跨域限制，这里使用模拟数据
    // 实际应用中，应该使用后端代理或JSONP等方式获取
    const versionInfo = {
      stable: {
        version: "1.5.0",
        desc: "这是稳定的正式发布版本，适合日常使用。"
      },
      beta: {
        version: "1.6.0-beta.3",
        desc: "这是测试版本，包含最新功能，但可能不稳定。"
      }
    };
    
    // 版本来源URL（仅用于构建下载链接）
    const versionUrls = {
      stable: 'https://bgithub.xyz/InkCanvasForClass/community/raw/refs/heads/main/AutomaticUpdateVersionControl.txt',
      beta: 'https://bgithub.xyz/InkCanvasForClass/community-beta/raw/refs/heads/main/AutomaticUpdateVersionControl.txt'
    };
    
    // 下载链接模板
    const downloadTemplates = {
      stable: 'https://bgithub.xyz/InkCanvasForClass/community/releases/download/{version}/InkCanvasForClass.CE.{version}.zip',
      beta: 'https://bgithub.xyz/InkCanvasForClass/community-beta/releases/download/{version}/InkCanvasForClass.CE.{version}.zip'
    };
    
    let currentChannel = 'stable';
    let latestVersion = '';
    
    // 初始加载正式版信息
    checkVersion('stable');
    
    // 切换版本通道
    stableBtn.addEventListener('click', function() {
      if (currentChannel !== 'stable') {
        currentChannel = 'stable';
        stableBtn.classList.add('active');
        betaBtn.classList.remove('active');
        checkVersion('stable');
      }
    });
    
    betaBtn.addEventListener('click', function() {
      if (currentChannel !== 'beta') {
        currentChannel = 'beta';
        betaBtn.classList.add('active');
        stableBtn.classList.remove('active');
        checkVersion('beta');
      }
    });
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', function() {
      if (latestVersion) {
        const downloadUrl = downloadTemplates[currentChannel].replace(/{version}/g, latestVersion);
        window.location.href = downloadUrl;
      }
    });
    
    // 检查最新版本
    function checkVersion(channel) {
      currentVersion.textContent = '检测中...';
      versionDesc.textContent = '';
      loadingIndicator.style.display = 'flex';
      downloadBtn.disabled = true;
      
      // 模拟网络请求延迟
      setTimeout(function() {
        try {
          // 获取版本信息
          latestVersion = versionInfo[channel].version;
          const description = versionInfo[channel].desc;
          
          // 更新UI
          currentVersion.textContent = latestVersion;
          versionDesc.textContent = description;
          loadingIndicator.style.display = 'none';
          downloadBtn.disabled = false;
        } catch (error) {
          // 错误处理
          loadingIndicator.style.display = 'none';
          currentVersion.textContent = '版本检测失败';
          versionDesc.textContent = '无法获取最新版本信息，请稍后再试。';
          console.error('获取版本信息失败:', error);
        }
      }, 1000); // 延迟1秒，模拟网络请求
      
      /* 
      // 真实场景下的代码 - 需要服务器支持CORS或使用代理
      fetch(versionUrls[channel])
        .then(response => {
          if (!response.ok) {
            throw new Error('网络错误');
          }
          return response.text();
        })
        .then(data => {
          loadingIndicator.style.display = 'none';
          downloadBtn.disabled = false;
          
          latestVersion = data.trim();
          currentVersion.textContent = latestVersion;
          
          if (channel === 'stable') {
            versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
          } else {
            versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
          }
        })
        .catch(error => {
          loadingIndicator.style.display = 'none';
          currentVersion.textContent = '版本检测失败';
          versionDesc.textContent = '无法获取最新版本信息，请稍后再试。';
          console.error('获取版本信息失败:', error);
        });
      */
    }
  });
})();
</script>

<style>
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
  border: 1px solid var(--vp-c-border, #ccc);
  background: var(--vp-c-bg-soft, #f5f5f5);
  color: var(--vp-c-text, #333);
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
  background: var(--vp-c-bg-soft, #f9f9f9);
  border-radius: 4px;
  border-left: 4px solid var(--vp-c-brand, #0078d4);
  color: var(--vp-c-text, #333);
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
  border: 4px solid var(--vp-c-bg-soft, rgba(0, 0, 0, 0.1));
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

@media (prefers-color-scheme: dark) {
  .version-info {
    background: var(--vp-c-bg-soft, #222);
  }
}
</style>
