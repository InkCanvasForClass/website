<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

interface Props {
    /** 左侧图片路径（相对于 public 目录） */
    image?: string
    /** 标题 */
    title?: string
    /** 正文说明 */
    text?: string
    /** 提示级别，决定左侧色条颜色：notice / content / serious */
    type?: 'notice' | 'content' | 'serious'
}

const props = withDefaults(defineProps<Props>(), {
    image: '/images/fix-bug.png',
    type: 'serious',
})

const messages = {
    'zh-CN': {
        title: '已知问题',
        text: '本文档描述的此功能存在已知的 Bug 或限制，可能在某些情况下无法正常工作。',
    },
    'en-US': {
        title: 'Known Bugs',
        text: 'The feature described in this document has known bugs or limitations and may not work correctly in certain situations.',
    },
} as const

const { lang } = useData()

const fallback = computed(() =>
    lang.value?.toLowerCase().startsWith('zh') ? messages['zh-CN'] : messages['en-US'],
)

const resolvedTitle = computed(() => props.title ?? fallback.value.title)
const resolvedText = computed(() => props.text ?? fallback.value.text)
</script>


<template>
    <div class="ambox" :class="`ambox--${props.type}`" role="note">
        <div class="ambox__image">
            <img class="no-zoom" :src="withBase(props.image)" alt="" loading="lazy" />
        </div>
        <div class="ambox__text">
            <p class="ambox__heading">
                <span class="ambox__title">
                    <slot name="title">{{ resolvedTitle }}</slot>
                </span>
            </p>
            <p class="ambox__body">
                <slot>{{ resolvedText }}</slot>
            </p>
        </div>
    </div>
</template>

<style scoped>
.ambox {
    --ambox-border: #a2a9b1;
    --ambox-bg: #fbfbfb;
    --ambox-accent: #f28500;
    --ambox-title: #202122;
    --ambox-body: #54595d;
    --ambox-link: #3366cc;
    --ambox-shadow: rgba(0, 0, 0, 0.04);

    display: flex;
    align-items: center;
    gap: 16px;
    box-sizing: border-box;
    width: 100%;
    margin: 1.4em 0;
    padding: 14px 18px;
    border: 1px solid var(--ambox-border);
    border-left: 10px solid var(--ambox-accent);
    background-color: var(--ambox-bg);
    box-shadow: 0 1px 0 var(--ambox-shadow);
}

.ambox--notice {
    --ambox-accent: #36c;
}

.ambox--content {
    --ambox-accent: #f28500;
}

.ambox--serious {
    --ambox-accent: #b32424;
}

.ambox__image {
    flex: 0 0 auto;
    width: 92px;
    text-align: center;
    overflow: hidden;
}

.ambox .ambox__image img {
    display: block;
    width: 100%;
    height: auto;
    margin: 0;
    border: 0;
}

.ambox__text {
    flex: 1 1 auto;
    min-width: 0;
    text-align: left;
}

.ambox .ambox__heading {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--ambox-title);
}

.ambox__title {
    font-weight: 700;
}

.ambox .ambox__body {
    margin: 0.25em 0 0;
    font-size: 14px;
    line-height: 1.65;
    color: var(--ambox-body);
}

.ambox :deep(a) {
    color: var(--ambox-link);
    font-weight: 400;
    text-decoration: none;
}

.ambox :deep(a:hover) {
    text-decoration: underline;
}

.dark .ambox {
    --ambox-border: #4c5054;
    --ambox-bg: #2b2f33;
    --ambox-accent: #ff9d3c;
    --ambox-title: #f0f2f5;
    --ambox-body: #c3c8ce;
    --ambox-link: #93b5f0;
    --ambox-shadow: rgba(0, 0, 0, 0.25);
}

.dark .ambox--notice {
    --ambox-accent: #6699ff;
}

.dark .ambox--content {
    --ambox-accent: #ff9d3c;
}

.dark .ambox--serious {
    --ambox-accent: #e56b6b;
}

.dark .ambox__image {
    background-color: rgba(255, 255, 255, 0.04);
}

.dark .ambox .ambox__image img {
    filter: brightness(0.92) contrast(1.02);
}

@media (max-width: 640px) {
    .ambox {
        gap: 12px;
        padding: 10px 12px;
        border-left-width: 8px;
    }

    .ambox__image {
        width: 60px;
    }

    .ambox .ambox__heading {
        font-size: 14px;
    }

    .ambox .ambox__body {
        font-size: 13px;
    }
}
</style>