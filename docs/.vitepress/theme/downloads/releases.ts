/**
 * 下载中心：发布版本的附件解析与整理
 *
 * 移植自 ICC 下载站 (js/releases.js) 的数据处理部分，渲染交给 Vue 组件。
 */
import type { Channel, Repo } from './config'
import type { GitHubAsset, GitHubRelease } from './network'

export interface AssetMeta {
  name: string
  size: number
  url: string
  repo: Repo
  version: string | null
  arch: 'x64' | 'x86'
  archLabel: string
  archLabelEn: string
  kind: 'installer' | 'portable'
  kindLabel: string
  kindLabelEn: string
  /** 该安装版是按 tag 从主仓库回源取得的 */
  fromMainRepo?: boolean
}

export interface ReleaseEntry {
  release: GitHubRelease
  assets: AssetMeta[]
}

export function formatSize(bytes: number): string {
  if (bytes === undefined || bytes === null) return ''
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function formatDate(value: string): string {
  const d = new Date(value)
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, '0')}-` +
    `${String(d.getDate()).padStart(2, '0')}`
  )
}

export function relativeTime(value: string, isEn = false): string {
  const diff = Date.now() - new Date(value).getTime()
  const day = Math.floor(diff / 86400000)

  if (day <= 0) {
    const hour = Math.floor(diff / 3600000)
    if (hour <= 0) return isEn ? 'just now' : '刚刚'
    return isEn ? `${hour} hour${hour > 1 ? 's' : ''} ago` : `${hour} 小时前`
  }
  if (day < 30) return isEn ? `${day} day${day > 1 ? 's' : ''} ago` : `${day} 天前`
  if (day < 365) {
    const month = Math.floor(day / 30)
    return isEn ? `${month} month${month > 1 ? 's' : ''} ago` : `${month} 个月前`
  }
  const year = Math.floor(day / 365)
  return isEn ? `${year} year${year > 1 ? 's' : ''} ago` : `${year} 年前`
}

/** 解析附件名：版本号 / 架构 / 安装方式 */
function parseAsset(asset: GitHubAsset, repo: Repo): AssetMeta {
  const name = asset.name || asset.browser_download_url.split('/').pop()!
  const versionMatch = name.match(/InkCanvasForClass\.CE\.((?:\d+\.)+\d+)/i)
  const isInstaller = /\.exe$/i.test(name)
  const isX64 = /-x64/i.test(name)

  return {
    name,
    size: asset.size,
    url: asset.browser_download_url,
    repo,
    version: versionMatch ? versionMatch[1] : null,
    arch: isX64 ? 'x64' : 'x86',
    archLabel: isX64 ? '64 位' : '32 位',
    archLabelEn: isX64 ? '64-bit' : '32-bit',
    kind: isInstaller ? 'installer' : 'portable',
    kindLabel: isInstaller ? '安装版' : '绿色版',
    kindLabelEn: isInstaller ? 'Installer' : 'Portable'
  }
}

function isNoiseAsset(asset: GitHubAsset): boolean {
  return /\.sigstore\.json$/i.test(asset.name || '')
}

/**
 * 整理某个 release 的附件。
 * community-beta 只发布 zip，安装版按相同 tag 回源主仓库 community。
 */
export function collectAssets(
  release: GitHubRelease,
  channel: Channel,
  fallbackReleases: GitHubRelease[] | null
): AssetMeta[] {
  const list = (release.assets || [])
    .filter((a) => !isNoiseAsset(a))
    .map((a) => parseAsset(a, channel.repo))

  const hasInstaller = list.some((a) => a.kind === 'installer')

  if (!hasInstaller && channel.installerFallbackRepo && fallbackReleases) {
    const origin = fallbackReleases.find((r) => r.tag_name === release.tag_name)
    if (origin) {
      ;(origin.assets || [])
        .filter((a) => !isNoiseAsset(a) && /\.exe$/i.test(a.name))
        .forEach((a) => {
          const meta = parseAsset(a, channel.installerFallbackRepo!)
          meta.fromMainRepo = true
          list.push(meta)
        })
    }
  }

  return list.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'installer' ? -1 : 1
    if (a.arch !== b.arch) return a.arch === 'x64' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

/** 过滤草稿与（按通道设置）预发布，按发布时间倒序 */
export function buildReleaseEntries(
  releases: GitHubRelease[],
  channel: Channel,
  fallbackReleases: GitHubRelease[] | null
): ReleaseEntry[] {
  return releases
    .filter((r) => !r.draft)
    .filter((r) => (channel.includePrerelease ? true : !r.prerelease))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .map((r) => ({ release: r, assets: collectAssets(r, channel, fallbackReleases) }))
}
