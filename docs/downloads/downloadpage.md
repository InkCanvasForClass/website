# InkCanvasForClass 下载中心

<div class="download-container">
  <div class="main-content">
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
  
  <div class="alternative-downloads">
    <div class="download-section">
      <h3>其他正式版下载地址</h3>
      <select class="download-select" onchange="if(this.value) window.location.href=this.value">
        <option value="">选择下载地址...</option>
        <option value="https://cjk-mkp.lanzouw.com/b004imjaej">蓝奏云一 (密码55ah)</option>
        <option value="https://www.ilanzou.com/s/DLYZ827G">蓝奏云二</option>
        <option value="https://docs.qq.com/aio/DR0JXWGVNTUVkZ1F6?no_promotion=1&p=oeqq176WTz8M9AuuJUdRDV&_t=1752559307913&nlc=1&u=4a48533a5c554ac19bde80b8b4536db0">腾讯文档</option>
      </select>
    </div>
    
    <div class="download-section">
      <h3>其他测试版下载地址</h3>
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
/* 主容器样式 */
.download-container {
  display: flex;
  gap: 30px;
  margin: 2rem 0;
}

.main-content {
  flex: 1;
}

/* 版本选择器样式 */
.version-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.version-selector button {
  padding: 8px 16px;
  background: var(--vp-c-bg-soft, #f5f5f5);
  border: 1px solid var(--vp-c-border, #e0e0e0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.version-selector button.active {
  background: var(--vp-c-primary, #42b983);
  color: white;
  border-color: var(--vp-c-primary, #42b983);
}

/* 版本信息样式 */
.version-info {
  margin-bottom: 20px;
}

.version-info h2 {
  margin: 0 0 10px 0;
  color: var(--vp-c-text-1, #333);
}

.version-info p {
  color: var(--vp-c-text-2, #666);
  margin: 0;
}

/* 下载按钮样式 */
.download-button button {
  padding: 12px 24px;
  background: var(--vp-c-primary, #42b983);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.download-button button:hover {
  background: var(--vp-c-primary-dark, #359e75);
}

.download-button button:disabled {
  background: var(--vp-c-gray-3, #ccc);
  cursor: not-allowed;
}

/* 加载指示器样式 */
.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--vp-c-text-2, #666);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--vp-c-border, #e0e0e0);
  border-top-color: var(--vp-c-primary, #42b983);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 右侧下载地址区域样式 */
.alternative-downloads {
  min-width: 300px;
  padding: 20px;
  background: var(--vp-c-bg-soft, #f5f5f5);
  border-radius: 4px;
  align-self: flex-start;
}

.download-section {
  margin-bottom: 20px;
}

.download-section h3 {
  margin-bottom: 10px;
  color: var(--vp-c-text, #333);
  font-size: 16px;
}

.download-select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--vp-c-border, #e0e0e0);
  border-radius: 4px;
  background: var(--vp-c-bg, white);
  color: var(--vp-c-text, #333);
  font-size: 14px;
  cursor: pointer;
}

/* 深色模式适配 */
html.dark .version-selector button {
  background: var(--vp-c-bg-soft-dark, #2a2a2a);
  border-color: var(--vp-c-border-dark, #444);
  color: var(--vp-c-text-dark, #fff);
}

html.dark .version-info h2 {
  color: var(--vp-c-text-1-dark, #fff);
}

html.dark .version-info p {
  color: var(--vp-c-text-2-dark, #bbb);
}

html.dark .loading {
  color: var(--vp-c-text-2-dark, #bbb);
}

html.dark .alternative-downloads {
  background: var(--vp-c-bg-soft-dark, #2a2a2a);
}

html.dark .download-section h3 {
  color: var(--vp-c-text-dark, #fff);
}

html.dark .download-select {
  background: var(--vp-c-bg-dark, #1a1a1a);
  border-color: var(--vp-c-border-dark, #444);
  color: var(--vp-c-text-dark, #fff);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-container {
    flex-direction: column;
  }
  
  .alternative-downloads {
    min-width: auto;
  }
}
</style>

<script>
(function() {
  // 版本通道和对应的版本信息URL
  const versionUrls = {
    stable: 'https://raw.githubusercontent.com/InkCanvasForClass/community/main/versions/stable.txt',
    beta: 'https://raw.githubusercontent.com/InkCanvasForClass/community/main/versions/beta.txt'
  };
  
  // 下载链接模板
  const downloadUrlTemplate = {
    stable: 'https://github.com/InkCanvasForClass/community/releases/download/v{version}/ICC-CE_v{version}.exe',
    beta: 'https://github.com/InkCanvasForClass/community/releases/download/v{version}-beta/ICC-CE_v{version}-beta.exe'
  };
  
  // DOM元素
  const stableBtn = document.getElementById('stableBtn');
  const betaBtn = document.getElementById('betaBtn');
  const currentVersion = document.getElementById('currentVersion');
  const versionDesc = document.getElementById('versionDesc');
  const downloadBtn = document.getElementById('downloadBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // 当前选中的通道
  let currentChannel = 'stable';
  // 最新版本号
  let latestVersion = '';
  // 首选的获取方法
  let preferredMethod = 'API';
  
  // 初始化
  init();
  
  function init() {
    // 绑定按钮事件
    stableBtn.addEventListener('click', () => switchChannel('stable'));
    betaBtn.addEventListener('click', () => switchChannel('beta'));
    downloadBtn.addEventListener('click', downloadLatestVersion);
    
    // 检查最新版本
    checkLatestVersion(currentChannel);
  }
  
  // 切换版本通道
  function switchChannel(channel) {
    if (channel === currentChannel) return;
    
    currentChannel = channel;
    latestVersion = '';
    
    // 更新按钮状态
    stableBtn.classList.toggle('active', channel === 'stable');
    betaBtn.classList.toggle('active', channel === 'beta');
    
    // 重置UI
    currentVersion.textContent = '检测中...';
    versionDesc.textContent = '';
    downloadBtn.disabled = true;
    loadingIndicator.style.display = 'flex';
    
    // 检查最新版本
    checkLatestVersion(channel);
  }
  
  // 检查最新版本
  function checkLatestVersion(channel) {
    // 首先尝试从GitHub API获取
    checkVersionFromAPI(channel);
  }
  
  // 从GitHub API获取版本信息
  function checkVersionFromAPI(channel) {
    const apiUrl = channel === 'stable' 
      ? 'https://api.github.com/repos/InkCanvasForClass/community/releases/latest'
      : 'https://api.github.com/repos/InkCanvasForClass/community/releases';
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API请求失败 (状态码: ${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        loadingIndicator.style.display = 'none';
        downloadBtn.disabled = false;
        
        let versionData;
        if (channel === 'beta') {
          // 测试版取第一个预发布版本
          versionData = data.find(release => release.prerelease);
        } else {
          // 正式版取最新发布
          versionData = data;
        }
        
        if (!versionData) {
          throw new Error('未找到版本信息');
        }
        
        // 提取版本号（去除v前缀）
        latestVersion = versionData.tag_name.replace('v', '');
        currentVersion.textContent = latestVersion;
        
        if (channel === 'stable') {
          versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
        } else {
          versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
        }
        
        // 更新首选方法，因为成功了
        preferredMethod = 'API';
      })
      .catch(error => {
        console.error('从GitHub API获取版本信息失败:', error);
        // 尝试从版本文件获取
        checkVersionFromFile(channel);
      });
  }
  
  // 从版本文件获取版本信息
  function checkVersionFromFile(channel) {
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
        
        console.log('成功获取版本文件内容:', data);
        
        try {
          // 解析版本文件内容，获取最新版本号
          latestVersion = parseVersionData(data);
          console.log('解析得到最新版本:', latestVersion);
          
          currentVersion.textContent = latestVersion;
          
          if (channel === 'stable') {
            versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
          } else {
            versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
          }
          
          // 更新首选方法，因为成功了
          preferredMethod = 'file';
        } catch (parseError) {
          console.error('解析版本文件失败:', parseError);
          currentVersion.textContent = '获取失败';
          versionDesc.textContent = '无法获取版本信息，请尝试其他下载方式。';
        }
      })
      .catch(error => {
        console.error('从版本文件获取版本信息失败:', error);
        loadingIndicator.style.display = 'none';
        currentVersion.textContent = '获取失败';
        versionDesc.textContent = '无法获取版本信息，请尝试其他下载方式。';
        downloadBtn.disabled = true;
      });
  }
  
  // 解析版本数据
  function parseVersionData(data) {
    // 简单解析：取第一行非空内容作为版本号
    const lines = data.trim().split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        return trimmedLine.replace('v', '');
      }
    }
    throw new Error('未在版本文件中找到有效版本号');
  }
  
  // 比较版本号，返回最新版本
  function compareVersions(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = i < partsA.length ? partsA[i] : 0;
      const numB = i < partsB.length ? partsB[i] : 0;
      
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }
    
    return 0; // 版本相同
  }
  
  // 下载最新版本
  function downloadLatestVersion() {
    if (!latestVersion) {
      alert('无法获取最新版本信息，请尝试其他下载方式');
      return;
    }
    
    // 构建下载链接
    const downloadUrl = downloadUrlTemplate[currentChannel].replace(/{version}/g, latestVersion);
    
    // 打开下载链接
    window.open(downloadUrl, '_blank');
  }
})();
</script>

## 下载说明

- 正式版：稳定可靠，适合日常教学使用
- 测试版：包含最新功能，但可能存在不稳定因素，适合体验新功能
- 所有版本均基于GPLv3许可证发布，确保用户的自由使用和修改权利

如果您在下载或使用过程中遇到任何问题，请参考我们的[故障排除指南](/guide/troubleshooting)或在GitHub上提交issue。
