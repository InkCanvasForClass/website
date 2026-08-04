<template>
  <div class="dl">
    <!-- 镜像状态 -->
    <div class="mirror-status">
      <span v-if="!mirrorReady" class="mirror-tag">
        <Icon name="spinner" :spin="true" />
        {{ t('正在检测下载镜像…', 'Detecting download mirrors…') }}
      </span>
      <template v-else>
        <span class="mirror-tag" :class="net.state.smartTeachAvailable ? 'mirror-tag--ok' : 'mirror-tag--off'">
          <Icon :name="net.state.smartTeachAvailable ? 'circle-check' : 'circle-xmark'" />
          {{ net.state.smartTeachAvailable
            ? t('智教联盟可用', 'Smart-Teach mirror available')
            : t('智教联盟不可用', 'Smart-Teach mirror unavailable') }}
        </span>
        <span class="mirror-tag">
          <Icon name="rocket" />
          {{ net.state.fastestMirror
            ? t('GitHub 加速：', 'GitHub proxy: ') + net.state.fastestMirror.replace(/^https?:\/\//, '')
            : t('GitHub 官方直连', 'GitHub direct connection') }}
        </span>
      </template>
    </div>

    <!-- 通道切换 -->
    <div class="segmented" role="tablist">
      <button
        v-for="key in CHANNEL_ORDER"
        :key="key"
        type="button"
        role="tab"
        class="segmented-btn"
        :class="[`segmented-btn--${key}`, { 'is-active': key === currentChannel }]"
        :aria-selected="key === currentChannel"
        @click="selectChannel(key)"
      >
        <Icon :name="CHANNELS[key].icon" />
        <span>{{ t(CHANNELS[key].shortLabel, CHANNELS[key].shortLabelEn) }}</span>
        <span v-if="CHANNELS[key].recommended" class="segmented-badge">
          {{ t('推荐', 'Recommended') }}
        </span>
      </button>
    </div>

    <!-- 通道说明 -->
    <div class="channel-desc" :class="`channel-desc--${currentChannel}`">
      <Icon :name="channel.type === 'nightly' ? 'triangle-exclamation' : 'circle-info'" />
      <span>
        <span v-html="t(channel.desc, channel.descEn)"></span>
        {{ t(' 数据来源：', ' Source: ') }}
        <a
          v-if="channel.type === 'nightly'"
          :href="`${channel.repo.url}/actions/workflows/${CONFIG.NIGHTLY.workflow}`"
          target="_blank"
          rel="noopener"
        >{{ CONFIG.NIGHTLY.workflow }} · {{ CONFIG.NIGHTLY.branch }}</a>
        <a v-else :href="`${channel.repo.url}/releases`" target="_blank" rel="noopener">{{ channel.repo.name }}</a>
        <br v-if="channel.installerFallbackRepo" />
        <span v-if="channel.installerFallbackRepo" class="channel-desc-extra">
          <Icon name="shuffle" />
          {{ t('该通道发布绿色版与安装版，安装版按相同 tag 取自主仓库。',
                'This channel provides both portable and installer builds; installers come from the main repository under the same tag.') }}
        </span>
      </span>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="errorText" class="release-empty">
      <Icon name="circle-exclamation" />
      <p>{{ errorText }}</p>
      <a class="btn btn--outlined" :href="`${channel.repo.url}/releases`" target="_blank" rel="noopener">
        {{ t('前往 GitHub 下载', 'Open GitHub Releases') }}
      </a>
    </div>

    <!-- Nightly 通道 -->
    <article v-else-if="channel.type === 'nightly'" class="release-item release-item--nightly">
      <header class="release-item-header">
        <div class="release-item-heading">
          <a
            class="release-item-title"
            :href="`${CONFIG.NIGHTLY.repo.url}/actions/workflows/${CONFIG.NIGHTLY.workflow}`"
            target="_blank"
            rel="noopener"
          >
            {{ t(`Nightly（${CONFIG.NIGHTLY.branch} 分支）`, `Nightly (${CONFIG.NIGHTLY.branch} branch)`) }}
            <Icon name="arrow-up-right-from-square" />
          </a>
          <span class="release-item-date">
            <Icon name="screwdriver-wrench" />
            {{ t('由 GitHub Actions 自动构建', 'Built automatically by GitHub Actions') }}
          </span>
        </div>
        <div class="release-item-badges">
          <span class="chip chip--nightly"><Icon name="moon" />Nightly</span>
          <span class="chip chip--prerelease"><Icon name="bug" />Debug</span>
        </div>
      </header>

      <div class="alert alert--danger">
        <div class="alert-title">
          <Icon name="skull-crossbones" />
          <span>{{ t('危险', 'Danger') }}</span>
        </div>
        <p v-if="isEn">
          Nightly builds are <b>untested</b> Debug artifacts that may contain severe defects, crashes or risk of data
          loss. <b>Do not use them in a real classroom.</b> If you hit problems, fall back to Beta or Stable.
        </p>
        <p v-else>
          Nightly 为<b>未经测试</b>的 Debug 构建，可能包含严重缺陷、崩溃或数据丢失风险，<b>请勿在正式课堂环境使用</b>。
          遇到问题请优先回退到 Beta 或正式版。
        </p>
      </div>

      <div v-if="nightlyRun" class="nightly-run">
        <div class="nightly-run-item">
          <Icon name="hashtag" />
          <span>{{ t('构建 #', 'Build #') }}{{ nightlyRun.run_number }}</span>
        </div>
        <div class="nightly-run-item">
          <Icon name="code-commit" />
          <a :href="`${CONFIG.NIGHTLY.repo.url}/commit/${nightlyRun.head_sha}`" target="_blank" rel="noopener">
            {{ String(nightlyRun.head_sha).slice(0, 7) }}
          </a>
        </div>
        <div class="nightly-run-item">
          <Icon name="clock" />
          <span>{{ formatDate(nightlyRun.updated_at) }}（{{ relativeTime(nightlyRun.updated_at, isEn) }}）</span>
        </div>
        <div class="nightly-run-item nightly-run-title">
          <Icon name="note-sticky" />
          <span>{{ String(nightlyRun.display_title || '').split('\n')[0] }}</span>
        </div>
      </div>
      <p v-else class="card-subtitle">
        {{ t('未能获取构建信息（可能触发 GitHub API 限流），但下载依然可用。',
              'Could not fetch build info (possibly GitHub API rate limiting), but downloads still work.') }}
      </p>

      <div class="divider"></div>

      <div class="nightly-proxy">
        <span class="card-subtitle">
          {{ t('下载加速（仅支持以下节点）：', 'Download proxy (only these nodes are supported):') }}
        </span>
        <div class="proxy-chips">
          <button
            v-for="p in CONFIG.NIGHTLY.proxies"
            :key="p.key"
            type="button"
            class="proxy-chip"
            :class="{ 'is-active': p.key === activeProxyKey }"
            @click="selectProxy(p.key)"
          >
            {{ t(p.label, p.labelEn) }}
          </button>
        </div>
      </div>

      <footer class="release-item-actions">
        <div class="asset-group">
          <div class="asset-group-header">
          <Icon name="file-zipper" />
            <span class="asset-group-title">{{ t('构建产物', 'Build artifacts') }}</span>
            <span class="asset-group-hint">{{ t('解压即用，无安装版', 'Extract and run; no installer available') }}</span>
          </div>
          <div class="asset-group-items">
            <button
              v-for="a in CONFIG.NIGHTLY.artifacts"
              :key="a.arch"
              type="button"
              class="download-btn"
              @click="onNightlyDownload(a)"
            >
              <span class="download-btn-icon"><Icon name="moon" /></span>
              <span class="download-btn-text">
                <span class="download-btn-title">
                  {{ t(a.archLabel, a.archLabelEn) }}
                  <span class="download-btn-version">Debug</span>
                </span>
                <span class="download-btn-meta">{{ t(a.note, a.noteEn) }}</span>
              </span>
            </button>
          </div>
        </div>
      </footer>
    </article>

    <!-- Release 通道 -->
    <template v-else-if="currentEntry">
      <article class="release-item">
        <header class="release-item-header">
          <div class="release-item-heading">
            <a class="release-item-title" :href="currentEntry.release.html_url" target="_blank" rel="noopener">
              {{ currentEntry.release.name || currentEntry.release.tag_name }}
              <Icon name="arrow-up-right-from-square" />
            </a>
            <span class="release-item-date">
              <Icon name="clock" />
              {{ formatDate(currentEntry.release.published_at) }}（{{
                relativeTime(currentEntry.release.published_at, isEn)
              }}）
            </span>
          </div>
          <div class="release-item-badges">
            <span class="chip" :class="`chip--${channel.key}`">
              <Icon :name="channel.icon" />{{ t(channel.label, channel.labelEn) }}
            </span>
            <span v-if="currentEntry.release.prerelease" class="chip chip--prerelease">
              <Icon name="bolt" />Pre-release
            </span>
            <span v-if="index === 0" class="chip chip--latest">
              <Icon name="certificate" />{{ t('最新', 'Latest') }}
            </span>
          </div>
        </header>

        <div class="markdown-body release-item-body" v-html="renderedNotes"></div>

        <div class="divider"></div>

        <h4 class="release-assets-title">
          <Icon name="circle-down" />
          <span>{{ t('下载', 'Download') }}</span>
        </h4>

        <footer class="release-item-actions">
          <template v-if="currentEntry.assets.length">
            <div v-for="g in assetGroups" :key="g.kind" class="asset-group">
              <template v-if="g.items.length">
                <div class="asset-group-header">
                  <Icon :name="g.icon" />
                  <span class="asset-group-title">{{ g.title }}</span>
                  <span class="asset-group-hint">{{ g.hint }}</span>
                </div>
                <div class="asset-group-items">
                  <button
                    v-for="a in g.items"
                    :key="a.name"
                    type="button"
                    class="download-btn"
                    :class="{ 'is-checking': checkingAsset === a.name }"
                    @click="onAssetDownload(a)"
                  >
                    <span class="download-btn-icon"><Icon name="download" /></span>
                    <span class="download-btn-text">
                      <span class="download-btn-title">
                        {{ t(a.archLabel, a.archLabelEn) }}
                        <span v-if="a.version" class="download-btn-version">v{{ a.version }}</span>
                      </span>
                      <span class="download-btn-meta">
                        {{ t(a.kindLabel, a.kindLabelEn) }} · {{ formatSize(a.size) }}
                        <span v-if="a.fromMainRepo" class="download-btn-tag">
                          {{ t('主仓库', 'Main repo') }}
                        </span>
                      </span>
                    </span>
                  </button>
                </div>
              </template>
            </div>
          </template>
          <p v-else class="card-subtitle">
            {{ t('该版本暂无可用附件。', 'No downloadable assets for this release.') }}
          </p>
        </footer>
      </article>

      <!-- 版本历史翻页 -->
      <div class="release-navigation">
        <button type="button" class="btn btn--outlined" :disabled="index === 0" @click="index--">
          <Icon name="arrow-left" />
          <span>{{ t('上一版', 'Newer') }}</span>
        </button>
        <span class="card-subtitle">{{ index + 1 }} / {{ entries.length }}</span>
        <button
          type="button"
          class="btn btn--outlined"
          :disabled="index === entries.length - 1"
          @click="index++"
        >
          <span>{{ t('下一版', 'Older') }}</span>
          <Icon name="arrow-right" />
        </button>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-else class="release-empty">
      <Icon name="inbox" />
      <p>{{ t('该通道暂无可用发布版本', 'No releases available on this channel') }}</p>
    </div>

    <!-- 下载弹窗 -->
    <transition name="modal-fade">
      <div
        v-if="modal.open"
        class="modal-overlay"
        :class="{ 'modal--danger': modal.requireConfirm }"
        @click.self="closeModal"
      >
        <div class="modal-content">
          <button class="modal-close" :aria-label="t('关闭弹窗', 'Close dialog')" @click="closeModal">&times;</button>

          <h2>{{ modal.title }}</h2>
          <p class="modal-thanks">{{ modal.subtitle }}</p>

          <p v-if="modal.fileName" class="modal-file">
            <span class="chip" :class="`chip--${channel.key}`">
              <Icon :name="channel.icon" />{{ t(channel.label, channel.labelEn) }}
            </span>
            <code>{{ modal.fileName }}</code>
          </p>

          <div v-if="modal.warning" class="alert" :class="modal.requireConfirm ? 'alert--danger' : 'alert--warning'">
            <div class="alert-title">
              <Icon :name="modal.requireConfirm ? 'skull-crossbones' : 'triangle-exclamation'" />
              <span>{{ modal.requireConfirm ? t('危险', 'Danger') : t('注意', 'Notice') }}</span>
            </div>
            <p v-html="modal.warning"></p>
          </div>

          <!-- 危险构建：强制阅读 + 勾选确认 -->
          <div v-if="modal.requireConfirm" class="modal-confirm">
            <label class="confirm-check" :class="{ 'is-locked': cooldown > 0 }">
              <input type="checkbox" v-model="riskAccepted" :disabled="cooldown > 0" />
              <span>
                {{ t('我已了解上述风险，并自行承担使用该构建的后果。',
                      'I understand the risks above and accept full responsibility for using this build.') }}
              </span>
            </label>
            <p v-if="cooldown > 0" class="confirm-cooldown">
              {{ t(`请先阅读风险说明，${cooldown} 秒后可继续`, `Please read the warning; available in ${cooldown}s`) }}
            </p>
            <div class="modal-actions">
              <button
                type="button"
                class="btn btn--filled"
                :disabled="!riskAccepted || cooldown > 0"
                @click="confirmDangerDownload"
              >
                {{ t('继续下载', 'Continue download') }}
              </button>
              <button type="button" class="btn btn--outlined" @click="closeModal">
                {{ t('取消', 'Cancel') }}
              </button>
            </div>
          </div>

          <!-- 普通通道：倒计时自动下载 -->
          <div v-else class="modal-auto">
            <p v-if="countdown > 0">
              <template v-if="isEn">
                Your download will start automatically in <strong>{{ countdown }}</strong> seconds.
              </template>
              <template v-else>
                您的文件将在 <strong>{{ countdown }}</strong> 秒后开始自动下载。
              </template>
            </p>
            <p v-else class="manual-tip">
              {{ t('若未开始，请使用下方手动下载：', "If the download didn't start, use the manual link below:") }}
            </p>
            <div class="modal-actions">
              <a class="btn btn--filled" :href="modal.url" @click.prevent="onManualDownload">
                {{ t('手动下载', 'Manual download') }}
              </a>
              <button type="button" class="btn btn--outlined" @click="closeModal">
                {{ t('关闭', 'Close') }}
              </button>
            </div>
            <p class="modal-help">
              {{ t('如果遇到任何问题，请通过社区或 GitHub Issues 联系我们。',
                    'If you run into any issues, please reach us via the community or GitHub Issues.') }}
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useData } from 'vitepress'
import Icon from './Icon.vue'
import { renderMarkdown } from './markdown'

import {
  CHANNELS,
  CHANNEL_ORDER,
  CONFIG,
  DEFAULT_CHANNEL,
  type Channel,
  type NightlyArtifact
} from '../downloads/config'
import * as net from '../downloads/network'
import type { WorkflowRun } from '../downloads/network'
import {
  buildReleaseEntries,
  formatDate,
  formatSize,
  relativeTime,
  type AssetMeta,
  type ReleaseEntry
} from '../downloads/releases'

const { lang } = useData()
const isEn = computed(() => lang.value === 'en-US')
const t = (cn: string, en: string) => (isEn.value ? en : cn)

// ---------- 状态 ----------
const currentChannel = ref(DEFAULT_CHANNEL)
const channel = computed<Channel>(() => CHANNELS[currentChannel.value])

const isLoading = ref(true)
const loadingText = ref('')
const errorText = ref('')
const mirrorReady = ref(false)

const entries = ref<ReleaseEntry[]>([])
const index = ref(0)
const currentEntry = computed<ReleaseEntry | undefined>(() => entries.value[index.value])

const nightlyRun = ref<WorkflowRun | null>(null)
const activeProxyKey = ref(CONFIG.NIGHTLY.proxies[0].key)

const checkingAsset = ref<string | null>(null)

const renderedNotes = computed(() =>
  currentEntry.value?.release.body ? renderMarkdown(currentEntry.value.release.body) : ''
)

const assetGroups = computed(() => {
  const assets = currentEntry.value?.assets || []
  return [
    {
      kind: 'installer' as const,
      icon: 'desktop',
      title: t('安装版', 'Installer'),
      hint: t('自动安装并创建快捷方式，推荐日常使用', 'Installs automatically and creates shortcuts; recommended'),
      items: assets.filter((a) => a.kind === 'installer')
    },
    {
      kind: 'portable' as const,
      icon: 'file-zipper',
      title: t('绿色版', 'Portable'),
      hint: t('解压即用，不写入系统', 'Extract and run; nothing written to the system'),
      items: assets.filter((a) => a.kind === 'portable')
    }
  ]
})

// ---------- localStorage ----------
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

// ---------- 通道加载 ----------
async function loadChannel(key: string, force = false) {
  if (!CHANNELS[key]) key = DEFAULT_CHANNEL
  if (key === currentChannel.value && !force) return

  currentChannel.value = key
  writeStorage(CONFIG.STORAGE_KEYS.channel, key)

  const ch = CHANNELS[key]
  errorText.value = ''
  entries.value = []
  index.value = 0
  isLoading.value = true
  loadingText.value = t(`正在获取 ${ch.label} …`, `Loading ${ch.labelEn}…`)

  if (ch.type === 'nightly') {
    if (!net.state.nightlyProxy) {
      const p = await net.detectNightlyProxy()
      activeProxyKey.value = p.key
    }
    if (!nightlyRun.value) nightlyRun.value = await net.getLatestNightlyRun()
    isLoading.value = false
    return
  }

  const releases = await net.getReleases(ch.repo)
  const fallbackReleases = ch.installerFallbackRepo ? await net.getReleases(ch.installerFallbackRepo) : null

  if (!releases.length) {
    isLoading.value = false
    errorText.value = t(
      `未能获取 ${ch.label} 的发布信息，请稍后重试或直接前往 GitHub。`,
      `Failed to load ${ch.labelEn} releases. Please retry later or visit GitHub directly.`
    )
    return
  }

  entries.value = buildReleaseEntries(releases, ch, fallbackReleases)
  index.value = 0
  isLoading.value = false
}

const selectChannel = (key: string) => loadChannel(key)

function selectProxy(key: string) {
  const found = CONFIG.NIGHTLY.proxies.find((p) => p.key === key)
  if (!found) return
  net.state.nightlyProxy = found
  activeProxyKey.value = key
  writeStorage(CONFIG.STORAGE_KEYS.nightlyProxy, key)
}

// ---------- 下载弹窗 ----------
const modal = reactive({
  open: false,
  url: '',
  title: '',
  subtitle: '',
  fileName: '',
  warning: '',
  requireConfirm: false
})

const countdown = ref(CONFIG.DOWNLOAD_COUNTDOWN)
const cooldown = ref(0)
const riskAccepted = ref(false)

let countdownTimer: ReturnType<typeof setInterval> | null = null
let cooldownTimer: ReturnType<typeof setInterval> | null = null
let downloadStarted = false

function clearTimers() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

function triggerDownload(url: string) {
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (e) {
    console.error('触发下载失败:', e)
  }
}

function closeModal() {
  clearTimers()
  modal.open = false
}

function openModal(info: {
  url: string
  version: string
  fileName: string
  warning?: string
  requireConfirm?: boolean
  warningTitle?: string
}) {
  clearTimers()
  downloadStarted = false
  riskAccepted.value = false

  modal.url = info.url
  modal.fileName = info.fileName
  modal.warning = info.warning || ''
  modal.requireConfirm = !!info.requireConfirm
  modal.open = true

  if (info.requireConfirm) {
    modal.title = info.warningTitle || t('确认下载风险', 'Confirm download risks')
    modal.subtitle = t(
      `您即将下载 InkCanvasForClass CE ${info.version}`,
      `You are about to download InkCanvasForClass CE ${info.version}`
    )
    cooldown.value = CONFIG.CONFIRM_COOLDOWN
    cooldownTimer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0) clearTimers()
    }, 1000)
    return
  }

  modal.title = t('感谢下载', 'Thank you for downloading')
  modal.subtitle = t(
    `感谢您下载 InkCanvasForClass CE ${info.version}`,
    `Thanks for downloading InkCanvasForClass CE ${info.version}`
  )

  countdown.value = CONFIG.DOWNLOAD_COUNTDOWN
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value > 0) return
    clearTimers()
    if (!downloadStarted) {
      downloadStarted = true
      triggerDownload(modal.url)
    }
  }, 1000)
}

function onManualDownload() {
  clearTimers()
  downloadStarted = true
  triggerDownload(modal.url)
  closeModal()
}

function confirmDangerDownload() {
  if (!riskAccepted.value || cooldown.value > 0) return
  triggerDownload(modal.url)
  closeModal()
}

// ---------- 下载入口 ----------
async function onAssetDownload(asset: AssetMeta) {
  checkingAsset.value = asset.name
  const url = await net.resolveDownloadUrl(asset.url, asset.repo)
  checkingAsset.value = null

  openModal({
    url,
    version: asset.version ? `v${asset.version}` : '',
    fileName: asset.name,
    warning:
      channel.value.key === 'beta'
        ? t(
            'Beta 版包含 pre-release，若遇到问题可切换到 <b>Preview</b> 或 <b>正式版</b>。',
            'Beta includes pre-releases. If you hit problems, switch to <b>Preview</b> or <b>Stable</b>.'
          )
        : ''
  })
}

function onNightlyDownload(artifact: NightlyArtifact) {
  openModal({
    url: net.nightlyUrl(artifact.url),
    version: nightlyRun.value ? `Nightly #${nightlyRun.value.run_number}` : 'Nightly',
    fileName: artifact.url.split('/').pop() || '',
    requireConfirm: true,
    warningTitle: t('确认下载 Debug 构建', 'Confirm downloading a Debug build'),
    warning: t(
      '这是由 CI 自动产出的 <b>未经测试的 Debug 构建</b>，可能包含严重缺陷、崩溃或数据丢失风险，' +
        '<b>开发者不承担任何责任，请勿用于正式课堂</b>。<br>如需稳定使用，请返回选择 <b>Beta 版</b> 通道。',
      'This is an <b>untested Debug build</b> produced automatically by CI. It may contain severe defects, crashes or ' +
        'risk of data loss. <b>The developers accept no liability &mdash; do not use it in a real classroom.</b><br>' +
        'For stable use, go back and pick the <b>Beta</b> channel.'
    )
  })
}

watch(isEn, () => {
  if (!isLoading.value && !errorText.value) return
  loadChannel(currentChannel.value, true)
})

onMounted(async () => {
  const savedChannel = readStorage(CONFIG.STORAGE_KEYS.channel)
  if (savedChannel && CHANNELS[savedChannel]) currentChannel.value = savedChannel

  const savedProxy = readStorage(CONFIG.STORAGE_KEYS.nightlyProxy)
  if (savedProxy) {
    const found = CONFIG.NIGHTLY.proxies.find((p) => p.key === savedProxy)
    if (found) {
      net.state.nightlyProxy = found
      activeProxyKey.value = found.key
    }
  }

  loadingText.value = t('正在检测下载镜像…', 'Detecting download mirrors…')
  await net.detectMirrors()
  mirrorReady.value = true

  await loadChannel(currentChannel.value, true)
})

onBeforeUnmount(clearTimers)
</script>

<style scoped>
.dl { max-width: 900px; margin: 0 auto; }
.mirror-status { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.mirror-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 13px; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-2); }
.mirror-tag--ok { color: var(--vp-c-green-1); border-color: var(--vp-c-green-soft); }
.mirror-tag--off { color: var(--vp-c-text-3); }
.segmented { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.segmented-btn { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font-size: 15px; cursor: pointer; transition: all 0.25s; }
.segmented-btn:hover { border-color: var(--vp-c-brand-1); }
.segmented-btn.is-active { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: #fff; }
.segmented-badge { padding: 1px 6px; border-radius: 999px; font-size: 11px; background: var(--vp-c-warning-soft); color: var(--vp-c-warning-1); }
.segmented-btn.is-active .segmented-badge { background: rgba(255,255,255,0.25); color: #fff; }
.channel-desc { display: flex; gap: 10px; padding: 12px 14px; margin-bottom: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6; background: var(--vp-c-bg-soft); border-left: 4px solid var(--vp-c-brand-1); color: var(--vp-c-text-2); }
.channel-desc--nightly { border-left-color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.channel-desc-extra { display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; color: var(--vp-c-text-3); }
.loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; color: var(--vp-c-text-2); }
.spinner { width: 32px; height: 32px; border: 4px solid var(--vp-c-divider); border-top-color: var(--vp-c-brand-1); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.release-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; color: var(--vp-c-text-2); }
.release-item { padding: 20px; border: 1px solid var(--vp-c-divider); border-radius: 12px; background: var(--vp-c-bg-soft); }
.release-item--nightly { border-color: var(--vp-c-danger-soft); }
.release-item-header { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: flex-start; }
.release-item-title { display: inline-flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 600; color: var(--vp-c-text-1) !important; text-decoration: none !important; }
.release-item-title:hover { color: var(--vp-c-brand-1) !important; }
.release-item-date { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; color: var(--vp-c-text-3); }
.release-item-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--vp-c-default-soft); color: var(--vp-c-text-2); }
.chip--beta { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.chip--preview { background: var(--vp-c-purple-soft); color: var(--vp-c-purple-1); }
.chip--stable { background: var(--vp-c-green-soft); color: var(--vp-c-green-1); }
.chip--nightly, .chip--prerelease { background: var(--vp-c-danger-soft); color: var(--vp-c-danger-1); }
.chip--latest { background: var(--vp-c-tip-soft); color: var(--vp-c-tip-1); }
.release-item-body { margin-top: 16px; font-size: 14px; line-height: 1.7; max-height: 420px; overflow-y: auto; }
.release-item-body :deep(h1), .release-item-body :deep(h2), .release-item-body :deep(h3), .release-item-body :deep(h4) { margin: 14px 0 6px; font-size: 15px; font-weight: 600; border: none; padding: 0; }
.release-item-body :deep(ul), .release-item-body :deep(ol) { margin: 6px 0; padding-left: 22px; }
.release-item-body :deep(code) { font-size: 12px; }
.divider { height: 1px; background: var(--vp-c-divider); margin: 20px 0; }
.release-assets-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.asset-group + .asset-group { margin-top: 18px; }
.asset-group-header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.asset-group-title { font-size: 15px; font-weight: 600; }
.asset-group-hint { font-size: 12px; color: var(--vp-c-text-3); }
.asset-group-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.download-btn { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--vp-c-divider); border-radius: 10px; background: var(--vp-c-bg); color: var(--vp-c-text-1); text-align: left; cursor: pointer; transition: all 0.2s; }
.download-btn:hover { border-color: var(--vp-c-brand-1); transform: translateY(-1px); }
.download-btn.is-checking { opacity: 0.6; pointer-events: none; }
.download-btn-icon { font-size: 18px; color: var(--vp-c-brand-1); }
.download-btn-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.download-btn-title { font-size: 15px; font-weight: 600; }
.download-btn-version { font-size: 12px; font-weight: 400; color: var(--vp-c-text-3); }
.download-btn-meta { font-size: 12px; color: var(--vp-c-text-3); }
.download-btn-tag { padding: 1px 5px; border-radius: 4px; background: var(--vp-c-default-soft); }
.release-navigation { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 14px; cursor: pointer; text-decoration: none !important; transition: all 0.2s; }
.btn--outlined { border: 1px solid var(--vp-c-divider); background: transparent; color: var(--vp-c-text-1); }
.btn--outlined:hover:not(:disabled) { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.btn--filled { border: 1px solid var(--vp-c-brand-1); background: var(--vp-c-brand-1); color: #fff !important; }
.btn--filled:hover:not(:disabled) { background: var(--vp-c-brand-2); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.card-subtitle { font-size: 13px; color: var(--vp-c-text-3); }
.alert { margin: 16px 0; padding: 12px 14px; border-radius: 8px; border-left: 4px solid; font-size: 14px; line-height: 1.65; text-align: left; }
.alert p { margin: 0; }
.alert--warning { background: var(--vp-c-warning-soft); border-left-color: var(--vp-c-warning-1); }
.alert--danger { background: var(--vp-c-danger-soft); border-left-color: var(--vp-c-danger-1); }
.alert-title { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-weight: 600; }
.alert--warning .alert-title { color: var(--vp-c-warning-1); }
.alert--danger .alert-title { color: var(--vp-c-danger-1); }
.nightly-run { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin: 16px 0; }
.nightly-run-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--vp-c-text-2); }
.nightly-run-title { grid-column: 1 / -1; }
.nightly-run-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nightly-proxy { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 18px; }
.proxy-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.proxy-chip { padding: 5px 12px; border: 1px solid var(--vp-c-divider); border-radius: 999px; background: var(--vp-c-bg); color: var(--vp-c-text-2); font-size: 13px; cursor: pointer; transition: all 0.2s; }
.proxy-chip.is-active { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-content { position: relative; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 28px 32px; border-radius: 12px; background: var(--vp-c-bg); color: var(--vp-c-text-1); text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
.modal--danger .modal-content { border-top: 4px solid var(--vp-c-danger-1); }
.modal-content h2 { margin: 0 0 8px; font-size: 20px; border: none; padding: 0; color: var(--vp-c-brand-1); }
.modal--danger .modal-content h2 { color: var(--vp-c-danger-1); }
.modal-thanks { margin: 0 0 12px; font-size: 14px; color: var(--vp-c-text-2); }
.modal-file { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; margin: 0 0 12px; }
.modal-file code { font-size: 12px; word-break: break-all; }
.modal-close { position: absolute; top: 10px; right: 14px; border: none; background: transparent; font-size: 26px; line-height: 1; cursor: pointer; color: var(--vp-c-text-3); }
.modal-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 14px; }
.modal-help, .manual-tip { margin-top: 12px; font-size: 13px; color: var(--vp-c-text-3); }
.modal-confirm { text-align: left; }
.confirm-check { display: flex; gap: 10px; font-size: 14px; line-height: 1.6; cursor: pointer; }
.confirm-check.is-locked { opacity: 0.55; cursor: not-allowed; }
.confirm-check input { margin-top: 4px; flex-shrink: 0; }
.confirm-cooldown { margin: 8px 0 0; font-size: 13px; color: var(--vp-c-danger-1); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
@media (max-width: 640px) {
  .asset-group-items { grid-template-columns: 1fr; }
  .modal-content { padding: 24px 20px; }
}
</style>
