# InkCanvasForClass 下载中心

<div class="download-container">
  <div class="version-selector">
    <button id="stableBtn" class="active">正式版</button>
    <button id="betaBtn">测试版</button>
  </div>
  
  <div class="version-info">
    <h2>当前版本: <span id="currentVersion">检测中...</span></h2>
    <p id="versionDesc"></p>
    <div class="release-notes" id="releaseNotes" style="display: none;">
      <h3>更新说明:</h3>
      <div id="releaseContent"></div>
    </div>
  </div>
  
  <div class="download-button">
    <button id="downloadBtn" disabled>下载最新版本</button>
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
    const releaseNotes = document.getElementById('releaseNotes');
    const releaseContent = document.getElementById('releaseContent');
    
    if (!stableBtn || !betaBtn || !currentVersion || !versionDesc || !downloadBtn || !loadingIndicator) {
      console.error('无法找到必要的DOM元素');
      return;
    }

    // GitHub API 配置
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

    // 下载链接模板
    const downloadTemplates = {
      stable: 'https://github.com/InkCanvasForClass/community/releases/download/{version}/InkCanvasForClass.CE.{version}.zip',
      beta: 'https://github.com/InkCanvasForClass/community-beta/releases/download/{version}/InkCanvasForClass.CE.{version}.zip'
    };
    
    let currentChannel = 'stable';
    let latestVersion = '';
    let downloadUrl = '';
    
    // 获取版本信息
    async function fetchVersionInfo(channel) {
      showLoading(true);
      const config = apiConfig[channel];
      
      try {
        // 使用 GitHub API 获取最新 release
        const response = await fetch(`https://api.github.com/repos/${config.repo}/releases/latest`);
        
        if (!response.ok) {
          throw new Error(`GitHub API 请求失败: ${response.status}`);
        }
        
        const release = await response.json();
        
        // 更新版本信息
        latestVersion = release.tag_name;
        currentVersion.textContent = latestVersion;
        versionDesc.textContent = config.description;
        
        // 显示更新说明
        if (release.body) {
          releaseContent.innerHTML = parseMarkdown(release.body);
          releaseNotes.style.display = 'block';
        } else {
          releaseNotes.style.display = 'none';
        }
        
        // 查找下载链接
        const asset = release.assets.find(asset => 
          asset.name.includes('InkCanvasForClass.CE') && asset.name.endsWith('.zip')
        );
        
        if (asset) {
          downloadUrl = asset.browser_download_url;
        } else {
          // 如果没有找到资源，使用模板生成下载链接
          downloadUrl = downloadTemplates[channel].replace(/{version}/g, latestVersion);
        }
        
        downloadBtn.disabled = false;
        showLoading(false);
        
      } catch (error) {
        console.error('获取版本信息失败:', error);
        useFallbackData(channel);
      }
    }
    
    // 简单的 Markdown 解析
    function parseMarkdown(text) {
      return text
        .replace(/### (.*)/g, '<h4>$1</h4>')
        .replace(/## (.*)/g, '<h3>$1</h3>')
        .replace(/# (.*)/g, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*)/g, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
    }
    
    // 显示/隐藏加载状态
    function showLoading(show) {
      loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    
    // 初始加载正式版信息
    fetchVersionInfo('stable');
    
    // 切换版本通道
    stableBtn.addEventListener('click', function() {
      if (currentChannel !== 'stable') {
        currentChannel = 'stable';
        stableBtn.classList.add('active');
        betaBtn.classList.remove('active');
        fetchVersionInfo('stable');
      }
    });
    
    betaBtn.addEventListener('click', function() {
      if (currentChannel !== 'beta') {
        currentChannel = 'beta';
        betaBtn.classList.add('active');
        stableBtn.classList.remove('active');
        fetchVersionInfo('beta');
      }
    });
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', function() {
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    });
    
    // 使用硬编码的备用数据
    function useFallbackData(channel) {
      console.log('GitHub API 请求失败，使用备用数据...');
      showLoading(false);
      
      const fallbackData = {
        stable: { version: '1.7.3.0', desc: '这是稳定的正式发布版本，适合日常使用。' },
        beta: { version: '1.7.3.0', desc: '这是测试版本，包含最新功能，但可能不稳定。' }
      };
      
      const data = fallbackData[channel];
      latestVersion = data.version;
      currentVersion.textContent = latestVersion;
      versionDesc.textContent = data.desc;
      downloadUrl = downloadTemplates[channel].replace(/{version}/g, latestVersion);
      releaseNotes.style.display = 'none';
      
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

.release-notes {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--vp-c-border, var(--border-color-light));
}

.release-notes h3 {
  margin: 0 0 10px 0;
  color: var(--vp-c-brand, #0078d4);
}

.release-notes h4 {
  margin: 10px 0 5px 0;
  font-size: 14px;
}

.release-notes ul {
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
