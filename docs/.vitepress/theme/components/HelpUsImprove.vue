<script setup lang="ts">
import { withBase } from 'vitepress'

interface Props {
    /** 左侧图片路径（相对于 public 目录） */
    image?: string
    /** 标题 */
    title?: string
    /** 副标题 */
    subtitle?: string
    /** 正文说明 */
    text?: string
    /** 提示级别，决定左侧色条颜色：notice / content / serious */
    type?: 'notice' | 'content' | 'serious'
}

const props = withDefaults(defineProps<Props>(), {
    image: '/images/help-us.png',
    title: '帮助我们完善这个文档！',
    subtitle: ' ',
    text: '这篇文档是AI生成的，可能存在过时或者错误。希望您可以帮助我们改进它！',
    type: 'content',
})
</script>

<template>
    <!-- MediaWiki ambox（文章信息框）风格提示 -->
    <div class="ambox" :class="`ambox--${props.type}`" role="note">
        <div class="ambox__image">
            <img class="no-zoom" :src="withBase(props.image)" alt="" loading="lazy" />
        </div>
        <div class="ambox__text">
            <p class="ambox__heading">
                <span class="ambox__title">
                    <slot name="title">{{ props.title }}</slot>
                </span>
                <span class="ambox__sep" aria-hidden="true"> </span>
                <span class="ambox__subtitle">
                    <slot name="subtitle">{{ props.subtitle }}</slot>
                </span>
            </p>
            <p class="ambox__body">
                <slot>{{ props.text }}</slot>
            </p>
        </div>
    </div>
</template>

<style scoped>
.ambox {
    /* 取自 MediaWiki Vector 皮肤的中性色板 */
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
    /* 直角、细边框、左侧粗色条：ambox 的标志性外观 */
    margin: 1.4em 0;
    padding: 14px 18px;
    border: 1px solid var(--ambox-border);
    border-left: 10px solid var(--ambox-accent);
    background-color: var(--ambox-bg);
    /* 正式的信息框不做悬停位移与阴影 */
    box-shadow: 0 1px 0 var(--ambox-shadow);
}

/* 级别配色，沿用 MediaWiki 的语义色 */
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
    border-radius: 6px;
}

.ambox .ambox__image img {
    display: block;
    width: 100%;
    height: auto;
    margin: 0;
    border: 0;
    border-radius: 6px;
}

.ambox__text {
    flex: 1 1 auto;
    min-width: 0;
    text-align: left;
}

/* 覆盖 VitePress .vp-doc p 的 16px 外边距 */
.ambox .ambox__heading {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--ambox-title);
}

.ambox__title {
    font-weight: 700;
}

.ambox__sep {
    font-weight: 700;
}

.ambox__subtitle {
    font-weight: 400;
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

/* 深色模式：结构保持一致，替换底色/文字色，色条提亮以保证对比度 */
/* 注意：不要用 :global(.dark) .ambox —— Vue scoped 会把整条选择器替换成 .dark，
   变量会落在 <html> 上，被 .ambox 自身的声明覆盖而失效。
   .dark 作为祖先选择器时，scoped 只给最后一个元素加 data-v 属性，本身就是全局匹配。 */
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

/* 图片多为浅底插画，暗色下略降亮度避免刺眼 */
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
