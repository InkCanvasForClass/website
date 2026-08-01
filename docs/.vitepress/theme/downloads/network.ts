/**
 * 下载中心网络层：镜像检测、GitHub API 拉取、下载地址转换
 *
 * 移植自 ICC 下载站 (js/network.js)，保持相同的探测与回退策略。
 */
import { CONFIG, type NightlyProxy, type Repo } from './config'

export interface GitHubAsset {
  name: string
  size: number
  browser_download_url: string
}

export interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  draft: boolean
  prerelease: boolean
  published_at: string
  assets: GitHubAsset[]
}

export interface WorkflowRun {
  run_number: number
  head_sha: string
  updated_at: string
  display_title: string
}

export const state = {
  /** GitHub 加速前缀，如 https://gh.llkk.cc；null 表示官方直连最快 */
  fastestMirror: null as string | null,
  /** 智教联盟镜像是否可用 */
  smartTeachAvailable: false,
  /** Nightly 使用的加速前缀配置项 */
  nightlyProxy: null as NightlyProxy | null,
  /** 镜像探测是否已完成 */
  detected: false
}

function timeoutFetch(url: string, options: RequestInit = {}, timeout?: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout ?? CONFIG.REQUEST_TIMEOUT)
  return fetch(url, {
    cache: 'no-store',
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timer))
}

/** 构造带镜像回退的 GitHub API 地址列表 */
export function buildApiUrls(endpoint: string): string[] {
  const urls: string[] = []
  const add = (u: string) => {
    if (!urls.includes(u)) urls.push(u)
  }

  if (state.fastestMirror) add(`${state.fastestMirror}/${CONFIG.GITHUB_API_BASE}${endpoint}`)
  add(`${CONFIG.GITHUB_API_BASE}${endpoint}`)
  CONFIG.MIRROR_URLS.forEach((m) => add(`${m}/${CONFIG.GITHUB_API_BASE}${endpoint}`))
  return urls
}

/** 依次尝试多个地址，返回第一个成功的 JSON */
async function fetchJsonWithFallback<T>(urls: string[]): Promise<T | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) return (await res.json()) as T
      console.log(`请求失败：${url} 状态码 ${res.status}`)
    } catch (e) {
      console.log(`请求失败：${url} ${(e as Error).message}`)
    }
  }
  return null
}

/** 竞速：返回最快可用的 GitHub 加速前缀（null 表示官方直连最快） */
export async function detectFastestMirror(): Promise<string | null> {
  const endpoint = `${CONFIG.REPOS.community.name}/releases/latest`
  const candidates: { prefix: string | null; url: string }[] = [
    { prefix: null, url: `${CONFIG.GITHUB_API_BASE}${endpoint}` },
    ...CONFIG.MIRROR_URLS.map((m) => ({ prefix: m, url: `${m}/${CONFIG.GITHUB_API_BASE}${endpoint}` }))
  ]

  const results = await Promise.all(
    candidates.map((c) => {
      const start = performance.now()
      return timeoutFetch(c.url, { method: 'HEAD' })
        .then(() => ({ prefix: c.prefix, cost: performance.now() - start }))
        .catch(() => ({ prefix: c.prefix, cost: Infinity }))
    })
  )

  const usable = results.filter((r) => r.cost !== Infinity).sort((a, b) => a.cost - b.cost)
  state.fastestMirror = usable.length ? usable[0].prefix : null
  return state.fastestMirror
}

/** 智教联盟镜像可用性检测 */
export async function detectSmartTeach(): Promise<boolean> {
  try {
    const res = await timeoutFetch(
      `${CONFIG.SMART_TEACH_DOMAIN}${CONFIG.REPOS.community.mirrorPath}/test.txt`,
      { method: 'HEAD' }
    )
    state.smartTeachAvailable = res.status < 400
  } catch {
    state.smartTeachAvailable = false
  }
  return state.smartTeachAvailable
}

/**
 * Nightly 加速前缀竞速。
 * 注意：nightly.link 不支持 HEAD（返回 404），必须用 GET + Range 探测。
 */
export async function detectNightlyProxy(): Promise<NightlyProxy> {
  const probeUrl = CONFIG.NIGHTLY.artifacts[0].url

  const results = await Promise.all(
    CONFIG.NIGHTLY.proxies.map((p) => {
      const start = performance.now()
      return timeoutFetch(p.prefix + probeUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } }, 6000)
        .then((res) => ({
          proxy: p,
          cost: res.ok || res.status === 206 ? performance.now() - start : Infinity
        }))
        .catch(() => ({ proxy: p, cost: Infinity }))
    })
  )

  const usable = results.filter((r) => r.cost !== Infinity).sort((a, b) => a.cost - b.cost)
  state.nightlyProxy = usable.length ? usable[0].proxy : CONFIG.NIGHTLY.proxies[0]
  return state.nightlyProxy
}

/** 套用 GitHub 加速前缀 */
export function toMirrorUrl(url: string): string {
  if (state.fastestMirror && url.startsWith('https://github.com/')) {
    return `${state.fastestMirror}/${url}`
  }
  return url
}

/** 构造智教联盟下载地址（按资源所属仓库分目录） */
export function toSmartTeachUrl(url: string, repo: Repo): string {
  const fileName = url.split('/').pop()
  return `${CONFIG.SMART_TEACH_DOMAIN}${repo.mirrorPath}/${fileName}`
}

/** 检查智教联盟上是否存在该文件 */
async function smartTeachHasFile(url: string, repo: Repo): Promise<boolean> {
  try {
    const res = await timeoutFetch(toSmartTeachUrl(url, repo), { method: 'HEAD' })
    return res.status === 200 || res.status === 302 || res.status === 403
  } catch {
    return false
  }
}

/**
 * 解析实际下载地址（点击下载时调用，会做一次存在性校验）
 * zip：优先智教联盟（校验文件存在），否则 GitHub 加速
 * exe：GitHub 加速
 */
export async function resolveDownloadUrl(originalUrl: string, repo: Repo): Promise<string> {
  if (/\.zip$/i.test(originalUrl) && state.smartTeachAvailable) {
    if (await smartTeachHasFile(originalUrl, repo)) return toSmartTeachUrl(originalUrl, repo)
  }
  return toMirrorUrl(originalUrl)
}

/** 预览用地址（渲染时使用，不做网络校验） */
export function previewDownloadUrl(originalUrl: string, repo: Repo): string {
  if (/\.zip$/i.test(originalUrl) && state.smartTeachAvailable) return toSmartTeachUrl(originalUrl, repo)
  return toMirrorUrl(originalUrl)
}

/** Nightly 产物下载地址 */
export function nightlyUrl(rawUrl: string): string {
  const proxy = state.nightlyProxy || CONFIG.NIGHTLY.proxies[0]
  return proxy.prefix + rawUrl
}

// ---------- 业务数据 ----------
const releasesCache: Record<string, GitHubRelease[]> = {}

export async function getReleases(repo: Repo): Promise<GitHubRelease[]> {
  if (releasesCache[repo.name]) return releasesCache[repo.name]
  const data = await fetchJsonWithFallback<GitHubRelease[]>(buildApiUrls(`${repo.name}/releases?per_page=30`))
  releasesCache[repo.name] = data || []
  return releasesCache[repo.name]
}

/** 最近一次成功的 Nightly 构建信息（失败返回 null，不影响下载） */
export async function getLatestNightlyRun(): Promise<WorkflowRun | null> {
  const cfg = CONFIG.NIGHTLY
  const endpoint =
    `${cfg.repo.name}/actions/workflows/${cfg.workflow}` +
    `/runs?branch=${cfg.branch}&status=success&per_page=1`
  try {
    const data = await fetchJsonWithFallback<{ workflow_runs: WorkflowRun[] }>(buildApiUrls(endpoint))
    return data?.workflow_runs?.length ? data.workflow_runs[0] : null
  } catch {
    return null
  }
}

/** 启动时的镜像探测，只执行一次 */
export async function detectMirrors(): Promise<void> {
  if (state.detected) return
  await Promise.all([detectSmartTeach(), detectFastestMirror()])
  state.detected = true
}
