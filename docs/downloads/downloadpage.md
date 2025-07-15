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
    
    // 初始加载正式版信息 - 直接从版本文件获取
    checkVersionFromFile('stable');
    
    // 切换版本通道
    stableBtn.addEventListener('click', function() {
      if (currentChannel !== 'stable') {
        currentChannel = 'stable';
        stableBtn.classList.add('active');
        betaBtn.classList.remove('active');
        checkVersionFromFile('stable');
      }
    });
    
    betaBtn.addEventListener('click', function() {
      if (currentChannel !== 'beta') {
        currentChannel = 'beta';
        betaBtn.classList.add('active');
        stableBtn.classList.remove('active');
        checkVersionFromFile('beta');
      }
    });
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', function() {
      if (latestVersion) {
        const downloadUrl = downloadTemplates[currentChannel].replace(/{version}/g, latestVersion);
        window.location.href = downloadUrl;
      }
    });
    
    // 从GitHub API获取最新release信息（由于不可靠，现在作为备用方法）
    function getLatestReleaseFromGitHub(channel) {
      console.log('尝试从GitHub API获取版本信息...');
      currentVersion.textContent = '检测中...';
      versionDesc.textContent = '';
      loadingIndicator.style.display = 'flex';
      downloadBtn.disabled = true;
      
      const repo = repos[channel];
      // 不再使用GitHub API，因为可能不可靠或有限制
      // 改为直接从版本文件获取
      checkVersionFromFile(channel);
    }
    
    // 主要方法：直接从版本文件获取
    function checkVersionFromFile(channel) {
      console.log('从版本文件获取版本信息...');
      currentVersion.textContent = '检测中...';
      versionDesc.textContent = '';
      loadingIndicator.style.display = 'flex';
      downloadBtn.disabled = true;
      
      // 使用公共CORS代理服务获取版本文件内容
      const corsProxy = 'https://corsproxy.io/?';
      const targetUrl = encodeURIComponent(versionUrls[channel]);
      
      fetch(`${corsProxy}${targetUrl}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`网络错误 (状态码: ${response.status})`);
          }
          return response.text();
        })
        .then(data => {
          loadingIndicator.style.display = 'none';
          downloadBtn.disabled = false;
          
          console.log('成功获取版本信息:', data);
          
          // 版本信息是纯文本格式
          latestVersion = data.trim();
          currentVersion.textContent = latestVersion;
          
          if (channel === 'stable') {
            versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
          } else {
            versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
          }
        })
        .catch(error => {
          console.error('获取版本文件失败:', error);
          // 尝试另一个CORS代理
          tryAlternativeCorsProxy(channel);
        });
    }
    
    // 尝试另一个CORS代理
    function tryAlternativeCorsProxy(channel) {
      console.log('尝试使用备用CORS代理...');
      
      // 备用CORS代理
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = versionUrls[channel];
      
      fetch(`${corsProxy}${targetUrl}`, {
        headers: {
          'Origin': window.location.origin
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`备用代理网络错误 (状态码: ${response.status})`);
          }
          return response.text();
        })
        .then(data => {
          loadingIndicator.style.display = 'none';
          downloadBtn.disabled = false;
          
          console.log('通过备用代理成功获取版本信息:', data);
          
          // 版本信息是纯文本格式
          latestVersion = data.trim();
          currentVersion.textContent = latestVersion;
          
          if (channel === 'stable') {
            versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
          } else {
            versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
          }
        })
        .catch(error => {
          console.error('备用代理获取失败:', error);
          // 所有尝试都失败，使用备用数据
          useFallbackData(channel);
        });
    }
    
    // 最后的备用方法：使用硬编码的备用数据
    function useFallbackData(channel) {
      console.log('所有网络请求失败，使用备用数据...');
      loadingIndicator.style.display = 'none';
      
      if (channel === 'stable') {
        latestVersion = '1.7.0.0';
        currentVersion.textContent = latestVersion;
        versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。(无法连接到服务器，显示备用数据)';
      } else {
        latestVersion = '1.7.0.4';
        currentVersion.textContent = latestVersion;
        versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。(无法连接到服务器，显示备用数据)';
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
