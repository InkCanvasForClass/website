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

<style>
.download-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Arial, sans-serif;
}

.version-selector {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.version-selector button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.3s;
}

.version-selector button.active {
  background: #0078d4;
  color: white;
  border-color: #0078d4;
}

.version-info {
  margin-bottom: 30px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #0078d4;
}

.download-button button {
  padding: 12px 30px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s;
}

.download-button button:hover {
  background: #005a9e;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #0078d4;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<ClientOnly>
  <div>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
      const stableBtn = document.getElementById('stableBtn');
      const betaBtn = document.getElementById('betaBtn');
      const currentVersion = document.getElementById('currentVersion');
      const versionDesc = document.getElementById('versionDesc');
      const downloadBtn = document.getElementById('downloadBtn');
      const loadingIndicator = document.getElementById('loadingIndicator');
      
      // 版本来源URL
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
            
            // 假设版本信息是纯文本格式
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
      }
    });
    </script>
  </div>
</ClientOnly>
