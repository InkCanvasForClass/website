import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/website/',
  title: 'ICC CE',
  description: '智能课堂绘图增强工具',
  head: [
    ['link', { rel: 'icon', href: '/icc-ce-web/images/logo.png' }],
  ],
  themeConfig: {
    logo: '/images/logo.png',
    nav: [
      { text: '<i class="fa-solid fa-house"></i> 首页', link: '/' },
      { text: '<i class="fa-solid fa-book"></i> 指南', link: '/guide/getting-started' },
      { text: '<i class="fa-solid fa-list-ul"></i> 功能', link: '/features/overview' },
      { text: '<i class="fa-solid fa-download"></i> 下载', link: '/download' },
      { text: '<i class="fa-solid fa-globe"></i> 官网', link: 'https://inkcanvasforclass.github.io/' },
      { text: '<i class="fa-brands fa-github"></i> 源码仓库', link: 'https://github.com/InkCanvasForClass/community' }
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
          ],
        },
      ],
      '/dev/': [
        {
          text: '开发文档',
          collapsed: false,
          items: [
            { text: 'URI 协议', link: '/dev/uri' },
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
      },
      { 
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 919"><defs><style>.a{fill:#1068af}.b{fill:#26a03d}</style></defs><path class="a" d="M643.3 134s-30.4-16.6-59.6-8.4L98.8 260.4 227.6 35.3S246.5-1.3 319.3.03l405 .6-77.5 135.5z"/><path class="a" d="M803.8 43l-82.2 143.8s20.7 19 26.6 40.6l72.1 275.9-278.2 84.3 100.2-160-31.3-120.7s-16.4-47.7-64-42.1c-.7.1-1.5.2-2.2.3-49.3 7.4-507.2 135-507.2 135s-36 10.2-37.6 46.1c0 0-.6 38.7 22.6 74.1l203 349 74.6-130.4s-23.7-21.3-26-32.1l-82-292.9 274.9-78.6s14.9-7.4 20.9 5.6l-120 150.3 40.9 134.4s17.8 29.6 59.6 29.8l528.6-144.9s35.1-6.7 25.1-59.8c0 0 1.5-19.8-14.8-52.1L803.8 43z"/><path class="b" d="M371.2 780.6s28.1 12 46.3 11.2l510.7-140.6-117.2 204.8s-28.5 57.2-96.4 57.1l-422.5 5.7 79.1-138.2z"/>'
        },
        link: 'https://forum.smart-teach.cn/t/icc-ce',
        ariaLabel: '智教联盟板块'
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
      md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
          let htmlResult = slf.renderToken(tokens, idx, options);
          if (tokens[idx].tag === 'h1') htmlResult += `<ArticleMetadata />`; 
          return htmlResult;
      }
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
});
