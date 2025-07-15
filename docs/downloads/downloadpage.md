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

<div class="alternative-downloads">
  <h3 class="section-title">其他下载地址</h3>

  <div class="download-section">
    <h4 class="download-title">正式版下载</h4>
    <select class="download-select" onchange="if(this.value) window.open(this.value, '_blank')">
      <option value="">选择下载地址...</option>
      <option value="https://cjk-mkp.lanzouw.com/b004imjaej">蓝奏云一 (密码55ah)</option>
      <option value="https://www.ilanzou.com/s/DLYZ827G">蓝奏云二</option>
      <option value="https://docs.qq.com/aio/DR0JXWGVNTUVkZ1F6?no_promotion=1&p=oeqq176WTz8M9AuuJUdRDV&_t=1752559307913&nlc=1&u=4a48533a5c554ac19bde80b8b4536db0">腾讯文档</option>
    </select>
  </div>

  <div class="download-section">
    <h4 class="download-title">测试版下载</h4>
    <select class="download-select" onchange="if(this.value) window.open(this.value, '_blank')">
      <option value="">选择下载地址...</option>
      <option value="https://cjk-mkp.lanzouw.com/b004imjafa">蓝奏云一 (密码b3ts)</option>
      <option value="https://www.ilanzou.com/s/IrPZ82Le">蓝奏云二</option>
      <option value="https://docs.qq.com/aio/DR0JXWGVNTUVkZ1F6?no_promotion=1&p=p2y1Tvbd3fS4In3WMECHKW&_t=1752559307913&nlc=1&u=4a48533a5c554ac19bde80b8b4536db0">腾讯文档</option>
      <option value="https://bgithub.xyz/InkCanvasForClass/community/actions">GitHub Action</option>
    </select>
  </div>
</div>

<style>
  .alternative-downloads {
    font-family: Arial, sans-serif;
    margin: 20px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .section-title {
    font-size: 1.5em;
    color: #333;
    margin-bottom: 15px;
  }

  .download-section {
    margin-bottom: 20px;
  }

  .download-title {
    font-size: 1.2em;
    color: #555;
    margin-bottom: 10px;
  }

  .download-select {
    width: 100%;
    padding: 10px;
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
  }

  .download-select:focus {
    border-color: #007bff;
    outline: none;
  }
</style>

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
    
    // 方法1：从GitHub API获取最新release信息
    function getLatestReleaseFromGitHub(channel) {
      console.log('尝试从GitHub API获取版本信息...');
      
      const repo = repos[channel];
      const corsProxy = 'https://ghfile.geekertao.top/?';
      const apiUrl = encodeURIComponent(`https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/latest`);
      
      fetch(`${corsProxy}${apiUrl}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`GitHub API错误 (状态码: ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          loadingIndicator.style.display = 'none';
          downloadBtn.disabled = false;
          
          console.log('成功从GitHub API获取数据:', data);
          
          try {
            // 从GitHub API响应中提取版本号（去掉v前缀）
            latestVersion = data.tag_name.replace(/^v/, '');
            console.log('解析得到最新版本:', latestVersion);
            
            currentVersion.textContent = latestVersion;
            
            // 设置描述信息
            if (data.body) {
              versionDesc.textContent = data.body.split('\n')[0]; // 使用release说明的第一行
            } else if (channel === 'stable') {
              versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
            } else {
              versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
            }
            
            // 更新首选方法，因为成功了
            preferredMethod = fetchMethods.API;
          } catch (parseError) {
            console.error('解析GitHub API响应失败:', parseError);
            // 尝试从版本文件获取
            checkVersionFromFile(channel);
          }
        })
        .catch(error => {
          console.error('从GitHub API获取版本信息失败:', error);
          // 尝试从版本文件获取
          checkVersionFromFile(channel);
        });
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
    
    // 从版本文件内容中获取最新版本
    function parseVersionData(data) {
      // 确保数据不为空
      if (!data || data.trim() === '') {
        throw new Error('版本文件内容为空');
      }
      
      // 分割为行，去除空行
      const lines = data.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      
      if (lines.length === 0) {
        throw new Error('版本文件不包含有效版本号');
      }
      
      // 如果只有一行，直接返回
      if (lines.length === 1) {
        return lines[0];
      }
      
      // 多行情况，查找最新版本
      console.log('版本文件包含多个版本:', lines);
      
      // 排序版本号（降序）
      lines.sort((a, b) => compareVersions(b, a));
      
      // 返回最新版本
      return lines[0];
    }
    
    // 方法2：直接从版本文件获取
    function checkVersionFromFile(channel) {
      console.log('从版本文件获取版本信息...');
      
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
            preferredMethod = fetchMethods.FILE;
          } catch (parseError) {
            console.error('解析版本信息失败:', parseError);
            // 尝试备用CORS代理
            tryAlternativeCorsProxy(channel);
          }
        })
        .catch(error => {
          console.error('获取版本文件失败:', error);
          // 尝试另一个CORS代理
          tryAlternativeCorsProxy(channel);
        });
    }
    
    // 方法3：尝试另一个CORS代理
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
          
          try {
            // 解析版本文件内容，获取最新版本号
            latestVersion = parseVersionData(data);
            console.log('通过备用代理解析得到最新版本:', latestVersion);
            
            currentVersion.textContent = latestVersion;
            
            if (channel === 'stable') {
              versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
            } else {
              versionDesc.textContent = '这是测试版本，包含最新功能，但可能不稳定。';
            }
            
            // 更新首选方法，因为成功了
            preferredMethod = fetchMethods.PROXY;
          } catch (parseError) {
            console.error('解析版本信息失败:', parseError);
            useFallbackData(channel);
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
        versionDesc.textContent = '这是稳定的正式发布版本，适合日常使用。';
      } else {
        latestVersion = '1.7.0.5';
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
