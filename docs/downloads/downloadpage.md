
# 软件下载

## 最新版本

<div id="version-info">
    <p>正在获取最新版本信息...</p>
</div>

<div class="download-section">
    <button id="download-button" class="download-btn">下载最新版本</button>
    <p id="download-info"></p>
</div>

## 系统要求

- Windows 10 或更高版本
- macOS 10.14 或更高版本
- Linux (Ubuntu 18.04+, Debian 10+)

## 历史版本

<div id="history-versions">
    <p>加载中...</p>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // API端点，用于获取最新版本信息
    const API_URL = 'https://api.example.com/releases/latest';
    const HISTORY_API_URL = 'https://api.example.com/releases';
    
    // 获取最新版本信息
    async function fetchLatestVersion() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('无法获取版本信息');
            }
            const data = await response.json();
            displayVersionInfo(data);
            setupDownloadButton(data);
        } catch (error) {
            document.getElementById('version-info').innerHTML = `
                <p class="error">获取版本信息时出错: ${error.message}</p>
                <p>请稍后再试或联系我们的支持团队。</p>
            `;
        }
    }
    
    // 显示版本信息
    function displayVersionInfo(data) {
        const versionInfo = document.getElementById('version-info');
        versionInfo.innerHTML = `
            <h3>版本 ${data.version}</h3>
            <p>发布日期: ${new Date(data.releaseDate).toLocaleDateString()}</p>
            <div class="version-notes">
                <h4>更新内容:</h4>
                <ul>
                    ${data.releaseNotes.map(note => `<li>${note}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // 设置下载按钮
    function setupDownloadButton(data) {
        const downloadButton = document.getElementById('download-button');
        const downloadInfo = document.getElementById('download-info');
        
        downloadButton.textContent = `下载最新版本 (${data.version})`;
        
        downloadButton.addEventListener('click', function() {
            // 根据用户的操作系统选择合适的下载链接
            const userOS = detectOS();
            const downloadLink = data.downloads[userOS] || data.downloads.default;
            
            if (downloadLink) {
                // 创建一个隐藏的a元素来实现下载
                const downloadElement = document.createElement('a');
                downloadElement.href = downloadLink;
                downloadElement.download = `软件名称-${data.version}-${userOS}.zip`;
                document.body.appendChild(downloadElement);
                downloadElement.click();
                document.body.removeChild(downloadElement);
                
                downloadInfo.textContent = '下载已开始，如果没有自动开始，请点击这里。';
                downloadInfo.innerHTML += `<a href="${downloadLink}" download>手动下载</a>`;
            } else {
                downloadInfo.textContent = '无法找到适合您系统的下载链接，请联系支持团队。';
            }
        });
    }
    
    // 检测用户操作系统
    function detectOS() {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf('Windows') !== -1) return 'windows';
        if (userAgent.indexOf('Mac') !== -1) return 'mac';
        if (userAgent.indexOf('Linux') !== -1) return 'linux';
        return 'default';
    }
    
    // 获取历史版本
    async function fetchHistoryVersions() {
        try {
            const response = await fetch(HISTORY_API_URL);
            if (!response.ok) {
                throw new Error('无法获取历史版本信息');
            }
            const data = await response.json();
            displayHistoryVersions(data);
        } catch (error) {
            document.getElementById('history-versions').innerHTML = `
                <p class="error">获取历史版本时出错: ${error.message}</p>
            `;
        }
    }
    
    // 显示历史版本
    function displayHistoryVersions(data) {
        const historyVersions = document.getElementById('history-versions');
        if (data.length === 0) {
            historyVersions.innerHTML = '<p>暂无历史版本</p>';
            return;
        }
        
        // 创建历史版本列表
        let historyHTML = '<ul class="history-list">';
        data.forEach(version => {
            if (version.isLatest) return; // 跳过最新版本，因为已经在上面显示了
            
            historyHTML += `
                <li>
                    <h4>版本 ${version.version}</h4>
                    <p>发布日期: ${new Date(version.releaseDate).toLocaleDateString()}</p>
                    <div class="download-links">
                        <a href="${version.downloads.windows}" download>Windows</a> | 
                        <a href="${version.downloads.mac}" download>macOS</a> | 
                        <a href="${version.downloads.linux}" download>Linux</a>
                    </div>
                </li>
            `;
        });
        historyHTML += '</ul>';
        
        historyVersions.innerHTML = historyHTML;
    }
    
    // 页面加载时获取信息
    fetchLatestVersion();
    fetchHistoryVersions();
});
</script>

<style>
/* 基本样式 */
.download-section {
    margin: 30px 0;
    text-align: center;
}

.download-btn {
    background-color: #4CAF50;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.3s;
}

.download-btn:hover {
    background-color: #45a049;
}

.error {
    color: #ff0000;
}

.history-list {
    list-style-type: none;
    padding: 0;
}

.history-list li {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.download-links a {
    text-decoration: none;
    color: #0066cc;
}

.download-links a:hover {
    text-decoration: underline;
}

.version-notes {
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
}
</style>
