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