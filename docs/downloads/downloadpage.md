# InkCanvasForClass 下载中心

<div class="download-container">
  <!-- 保持现有HTML结构不变 -->
</div>

<script>
(function() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', function() {
    // 保持现有DOM元素获取代码不变
    
    // 仓库信息 - 修正API访问路径
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
    
    // 版本文件URL - 使用直接访问链接
    const versionUrls = {
      stable: `https://raw.githubusercontent.com/${repos.stable.owner}/${repos.stable.repo}/main/${repos.stable.versionFile}`,
      beta: `https://raw.githubusercontent.com/${repos.beta.owner}/${repos.beta.repo}/main/${repos.beta.versionFile}`
    };
    
    // 下载链接模板 - 保持不变
    const downloadTemplates = {
      stable: 'https://github.com/InkCanvasForClass/community/releases/download/{version}/InkCanvasForClass.CE.{version}.zip',
      beta: 'https://github.com/InkCanvasForClass/community-beta/releases/download/{version}/InkCanvasForClass.CE.{version}.zip'
    };
    
    // 增加多个CORS代理选项
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/get?url='
    ];
    
    // 保持其他变量定义不变
    
    // 修改版本获取主函数
    function fetchVersionInfo(channel, method) {
      currentVersion.textContent = '检测中...';
      versionDesc.textContent = '';
      loadingIndicator.style.display = 'flex';
      downloadBtn.disabled = true;
      
      console.log(`使用${method}方法获取${channel}通道的版本信息...`);
      
      // 尝试所有可用方法直到成功
      const fetchMethods = [
        () => getLatestReleaseFromGitHub(channel),
        () => checkVersionFromFile(channel, 0), // 0表示第一个代理
        () => useFallbackData(channel)
      ];
      
      // 依次尝试各种方法
      let methodIndex = 0;
      const tryNextMethod = () => {
        if (methodIndex < fetchMethods.length) {
          fetchMethods[methodIndex]()
            .then(success => {
              if (!success) {
                methodIndex++;
                tryNextMethod();
              }
            })
            .catch(() => {
              methodIndex++;
              tryNextMethod();
            });
        } else {
          // 所有方法都失败
          useFallbackData(channel);
        }
      };
      
      tryNextMethod();
    }
    
    // 从GitHub API获取最新release信息 - 优化错误处理
    function getLatestReleaseFromGitHub(channel) {
      return new Promise((resolve) => {
        console.log('尝试从GitHub API获取版本信息...');
        const repo = repos[channel];
        const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/latest`;
        
        // 尝试带代理和不带代理两种方式
        const tryFetch = (url) => {
          return fetch(url)
            .then(response => {
              if (!response.ok) throw new Error(`HTTP状态码: ${response.status}`);
              return response.json();
            })
            .then(data => {
              if (!data || !data.tag_name) throw new Error('无效的API响应');
              
              latestVersion = data.tag_name.replace(/^v/, '');
              currentVersion.textContent = latestVersion;
              versionDesc.textContent = data.body ? data.body.split('\n')[0] : 
                (channel === 'stable' ? '稳定的正式发布版本' : '测试版本');
              
              loadingIndicator.style.display = 'none';
              downloadBtn.disabled = false;
              preferredMethod = fetchMethods.API;
              resolve(true);
            })
            .catch(error => {
              console.error('GitHub API获取失败:', error);
              return false;
            });
        };
        
        // 先尝试直接访问
        tryFetch(apiUrl)
          .then(success => {
            if (!success) {
              // 再尝试使用代理
              tryFetch(`${corsProxies[0]}${encodeURIComponent(apiUrl)}`)
                .then(success => resolve(success));
            }
          });
      });
    }
    
    // 从版本文件获取 - 增加代理轮换
    function checkVersionFromFile(channel, proxyIndex) {
      return new Promise((resolve) => {
        if (proxyIndex >= corsProxies.length) {
          resolve(false);
          return;
        }
        
        console.log(`使用代理 ${proxyIndex} 从版本文件获取版本信息...`);
        const corsProxy = corsProxies[proxyIndex];
        let targetUrl = versionUrls[channel];
        let fetchUrl;
        
        // 不同代理可能需要不同的URL格式
        if (corsProxy.includes('allorigins')) {
          fetchUrl = `${corsProxy}${encodeURIComponent(targetUrl)}`;
        } else {
          fetchUrl = `${corsProxy}${encodeURIComponent(targetUrl)}`;
        }
        
        fetch(fetchUrl)
          .then(response => {
            if (!response.ok) throw new Error(`网络错误 (状态码: ${response.status})`);
            
            // 处理allorigins的特殊响应格式
            if (corsProxy.includes('allorigins')) {
              return response.json().then(data => data.contents);
            }
            return response.text();
          })
          .then(data => {
            latestVersion = parseVersionData(data);
            currentVersion.textContent = latestVersion;
            versionDesc.textContent = channel === 'stable' ? 
              '这是稳定的正式发布版本，适合日常使用。' : 
              '这是测试版本，包含最新功能，但可能不稳定。';
            
            loadingIndicator.style.display = 'none';
            downloadBtn.disabled = false;
            preferredMethod = fetchMethods.FILE;
            resolve(true);
          })
          .catch(error => {
            console.error(`代理 ${proxyIndex} 获取失败:`, error);
            // 尝试下一个代理
            checkVersionFromFile(channel, proxyIndex + 1).then(resolve);
          });
      });
    }
    
    // 保持其他函数不变 (compareVersions, parseVersionData等)
    
    // 初始化 - 使用更可靠的方法顺序
    fetchVersionInfo('stable', fetchMethods.FILE);
  });
})();
</script>

<!-- 保持样式不变 -->
