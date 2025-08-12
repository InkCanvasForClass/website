import { defineConfig } from 'vitepress'
import markdownItTaskCheckbox from 'markdown-it-task-checkbox'

export default {
  base: '/website/',
  title: 'ICC CE | 智能课堂绘图增强工具',
  description: '智能课堂绘图增强工具',
  head: [
    ['link', { rel: 'icon', href: '/icc-ce-web/images/logo.png' }],
  ],
  themeConfig: {
    logo: '/images/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '功能', link: '/features/overview' },
      { text: '下载', link: '/downloads/downloadpage' },
      { text: 'GitHub', link: 'https://github.com/InkCanvasForClass/community' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '高级技巧', link: '/guide/advanced-tips' },
            { text: '设置指南', link: '/guide/settings' },
            { text: '故障排除', link: '/guide/troubleshooting' },
            { text: '使用指南', link: '/guide/instruction-manual' },
          ],
        },
      ],
      '/features/': [
        {
          text: '功能文档',
          collapsed: false,
          items: [
            { text: '功能概览', link: '/features/overview' },
            { text: '智能笔迹处理', link: '/features/overview' },
            { text: 'PowerPoint集成', link: '/features/overview' },
            { text: '触控支持', link: '/features/overview' },
            { text: '自动化功能', link: '/features/overview' },
          ],
        },
      ],
    },
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "没有找到结果",
            resetButtonTitle: "清除搜索条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
    },
    socialLinks: [
      { 
        icon: 'qq',
        link: 'https://qm.qq.com/q/iSI4386leo',
        ariaLabel: 'QQ 群'
      },
      { 
        icon: 'discord',
        link: 'https://discord.gg/ahj7eJWhEG',
        ariaLabel: 'Discord'
      },
      { 
        icon: 'github',
        link: 'https://github.com/InkCanvasForClass/website',
        ariaLabel: 'GitHub 仓库'
      }
    ],
    footer: {
      message: '基于 GPLv3 许可证发布',
      copyright: 'Copyright © 2023-现在 ICC-CE 团队',
    },
    outline: {
      level: [2, 3],
      label: '页面导航'
    },
    editLink: {
      pattern: 'https://github.com/InkCanvasForClass/website/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于'
    },

    notFound: {
      title: '页面未找到',
      quote:
        '但如果你不改变方向，并且继续寻找，你可能最终会到达你所前往的地方。',
      linkLabel: '前往首页',
      linkText: '带我回首页'
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    skipToContentLabel: '跳转到内容'
  },

  cleanUrls: true,
  
  markdown: {
    config: (md) => {
      md.use(markdownItTaskCheckbox)
    },
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    image: {
      lazyLoading: true
    },
    container: {
      tipLabel: '提示',
      warningLabel: '警告',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详细信息'
    },
    lineNumbers: true
  },
};
