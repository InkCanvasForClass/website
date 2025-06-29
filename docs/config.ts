export default {
  title: 'ICC-CE',
  description: '智能课堂绘图增强工具',
  themeConfig: {
    logo: '/images/logo.png',
    nav: [
      { text: '首页', link: '/icc-ce-web/index' },
      { text: '指南', link: '/icc-ce-web/guide/getting-started' },
      { text: '功能', link: '/icc-ce-web/features/overview' },
      { text: 'GitHub', link: 'https://github.com/awesome-iwb/icc-ce' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/icc-ce-web/guide/getting-started' },
            { text: '高级技巧', link: '/icc-ce-web/guide/advanced-tips' },
            { text: '设置指南', link: '/icc-ce-web/guide/settings' },
            { text: '故障排除', link: '/icc-ce-web/guide/troubleshooting' },
          ],
        },
      ],
      '/features/': [
        {
          text: '功能文档',
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
    socialLinks: [
      { icon: 'github', link: 'https://github.com/InkCanvasForClass/community' },
    ],
    footer: {
      message: '基于MIT许可证发布',
      copyright: 'Copyright © 2023-现在 ICC-CE 团队',
    },
    search: {
      provider: 'local',
    },
  },
};
