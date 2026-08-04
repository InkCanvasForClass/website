/**
 * 下载中心：全局配置与更新通道定义
 * -------------------------------------------------------------
 * 更新通道说明：
 *  Beta   (beta)   ：beta 仓库 community-beta 的 release，包含 pre-release
 *  Preview(preview)：beta 仓库 community-beta 的 release，不含 pre-release
 *  正式版 (stable) ：主仓库 community 的 release，不含 pre-release
 *  Nightly(nightly)：dotnet-desktop 工作流 net6 分支的最新构建产物
 *
 * 注：community-beta 仓库只发布绿色版(zip)，因此 Preview / Beta 通道的
 *     安装版(exe) 会按相同 tag 回源到主仓库 community 获取。
 */

export interface Repo {
  key: string
  name: string
  url: string
  mirrorPath: string
}

export interface NightlyProxy {
  key: string
  label: string
  labelEn: string
  prefix: string
}

export interface NightlyArtifact {
  arch: string
  archLabel: string
  archLabelEn: string
  note: string
  noteEn: string
  url: string
}

export interface Channel {
  key: string
  type: 'release' | 'nightly'
  label: string
  labelEn: string
  shortLabel: string
  shortLabelEn: string
  icon: string
  recommended?: boolean
  repo: Repo
  includePrerelease?: boolean
  /** 该仓库无 exe，安装版按 tag 回源到此仓库 */
  installerFallbackRepo?: Repo
  desc: string
  descEn: string
}

export const REPOS: Record<string, Repo> = {
  community: {
    key: 'community',
    name: 'InkCanvasForClass/community',
    url: 'https://github.com/InkCanvasForClass/community',
    mirrorPath: '/d/Ningbo-S3/shared/jiangling/community'
  },
  communityBeta: {
    key: 'communityBeta',
    name: 'InkCanvasForClass/community-beta',
    url: 'https://github.com/InkCanvasForClass/community-beta',
    mirrorPath: '/d/Ningbo-S3/shared/jiangling/community-beta'
  }
}

export const CONFIG = {
  REPOS,

  GITHUB_API_BASE: 'https://api.github.com/repos/',
  SMART_TEACH_DOMAIN: 'https://get.smart-teach.cn',

  /** GitHub Release / API 通用加速镜像 */
  MIRROR_URLS: [
    'https://gh.llkk.cc',
    'https://ghfile.geekertao.top',
    'https://gh.dpik.top',
    'https://github.dpik.top',
    'https://github.acmsz.top',
    'https://git.yylx.win'
  ],

  /** Nightly（CI 构建）配置 */
  NIGHTLY: {
    repo: REPOS.community,
    workflow: 'dotnet-desktop.yml',
    branch: 'net6',
    /** nightly.link 只支持以下加速前缀 */
    proxies: [
      { key: 'direct', label: '官方直连', labelEn: 'Direct', prefix: '' },
      { key: 'gh-proxy', label: 'gh-proxy.org', labelEn: 'gh-proxy.org', prefix: 'https://gh-proxy.org/' },
      { key: 'hlmirror', label: 'all.hlmirror.com', labelEn: 'all.hlmirror.com', prefix: 'https://all.hlmirror.com/' }
    ] as NightlyProxy[],
    artifacts: [
      {
        arch: 'x86',
        archLabel: '32 位',
        archLabelEn: '32-bit',
        note: '适用于 32 位系统',
        noteEn: 'For 32-bit systems',
        url: 'https://nightly.link/InkCanvasForClass/community/workflows/dotnet-desktop/net6/InkCanvasForClass.CE.debug.x86.zip'
      },
      {
        arch: 'x64',
        archLabel: '64 位',
        archLabelEn: '64-bit',
        note: '适用于 64 位系统',
        noteEn: 'For 64-bit systems',
        url: 'https://nightly.link/InkCanvasForClass/community/workflows/dotnet-desktop/net6/InkCanvasForClass.CE.debug.AnyCPU.zip'
      }
    ] as NightlyArtifact[]
  },

  STORAGE_KEYS: {
    channel: 'icc-release-channel',
    nightlyProxy: 'icc-nightly-proxy'
  },

  /** 下载弹窗自动开始下载的倒计时（秒） */
  DOWNLOAD_COUNTDOWN: 5,
  /** 危险构建确认前的强制阅读时间（秒） */
  CONFIRM_COOLDOWN: 10,

  REQUEST_TIMEOUT: 3000
}

export const CHANNELS: Record<string, Channel> = {
  beta: {
    key: 'beta',
    type: 'release',
    label: 'Beta 版',
    labelEn: 'Beta',
    shortLabel: 'Beta',
    shortLabelEn: 'Beta',
  icon: 'flask',
    recommended: true,
    repo: REPOS.communityBeta,
    includePrerelease: true,
    installerFallbackRepo: REPOS.community,
    desc: '来自 <b>community-beta</b> 仓库的全部发布（<b>包含</b> pre-release）。更新最快、修复最及时，是目前<b>最推荐</b>的日常使用版本。',
    descEn:
      'All releases from the <b>community-beta</b> repository (<b>including</b> pre-releases). Fastest updates and fixes &mdash; the <b>recommended</b> build for daily use.'
  },
  preview: {
    key: 'preview',
    type: 'release',
    label: 'Preview 版',
    labelEn: 'Preview',
    shortLabel: 'Preview',
    shortLabelEn: 'Preview',
  icon: 'wand-magic-sparkles',
    repo: REPOS.communityBeta,
    includePrerelease: false,
    installerFallbackRepo: REPOS.community,
    desc: '来自 <b>community-beta</b> 仓库的正式发布（<b>不含</b> pre-release）。相比 Beta 更为收敛，适合想尝鲜又偏好稳定的用户。',
    descEn:
      'Stable releases from the <b>community-beta</b> repository (<b>excluding</b> pre-releases). More conservative than Beta &mdash; for users who want new features but prefer stability.'
  },
  stable: {
    key: 'stable',
    type: 'release',
    label: '正式版',
    labelEn: 'Stable',
    shortLabel: '正式版',
    shortLabelEn: 'Stable',
  icon: 'circle-check',
    repo: REPOS.community,
    includePrerelease: false,
    desc: '来自主仓库 <b>community</b> 的正式发布（<b>不含</b> pre-release）。发布频率最低，适合对稳定性要求极高的场景。',
    descEn:
      'Official releases from the main <b>community</b> repository (<b>excluding</b> pre-releases). Lowest release frequency &mdash; for scenarios demanding maximum stability.'
  },
  nightly: {
    key: 'nightly',
    type: 'nightly',
    label: 'Nightly 构建',
    labelEn: 'Nightly Build',
    shortLabel: 'Nightly',
    shortLabelEn: 'Nightly',
  icon: 'moon',
    repo: REPOS.community,
    desc: '由 GitHub Actions 自动构建的 <b>Debug</b> 产物（net6 分支最新提交），未经测试、可能无法正常运行，仅供开发者与测试者使用。',
    descEn:
      '<b>Debug</b> artifacts built automatically by GitHub Actions (latest commit on the net6 branch). Untested and may not run at all &mdash; for developers and testers only.'
  }
}

export const CHANNEL_ORDER = ['beta', 'preview', 'stable', 'nightly']
export const DEFAULT_CHANNEL = 'beta'
