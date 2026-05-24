import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
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
          text: '核心功能模块',
          collapsed: false,
          items: [
            { text: '核心功能模块', link: '/dev/core-modules' },
            {
              text: '白板书写系统',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/whiteboard-system/' },
                { text: 'InkCanvas 核心组件', link: '/dev/whiteboard-system/inkcanvas-core' },
                { text: '笔迹平滑处理', link: '/dev/whiteboard-system/ink-smoothing' },
                { text: '墨迹渐隐效果', link: '/dev/whiteboard-system/ink-fadeout' },
                { text: '颜色和笔刷管理', link: '/dev/whiteboard-system/color-brush-management' },
                { text: '页面和画布管理', link: '/dev/whiteboard-system/page-canvas-management' },
              ]
            },
            {
              text: '工具栏管理系统',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/toolbar-system/' },
                { text: '架构设计', link: '/dev/toolbar-system/architecture' },
                { text: '工具栏项实现', link: '/dev/toolbar-system/item-implementation' },
                { text: '注册中心', link: '/dev/toolbar-system/registry' },
                { text: '自定义与扩展', link: '/dev/toolbar-system/customization' },
              ]
            },
            { text: '页面管理功能', link: '/dev/page-management' },
            {
              text: '颜色笔刷管理系统',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/color-brush-system/' },
                { text: '笔刷类型管理', link: '/dev/color-brush-system/brush-types' },
                { text: '笔刷效果调节', link: '/dev/color-brush-system/brush-effects' },
                { text: '颜色选择器', link: '/dev/color-brush-system/color-picker' },
                { text: '主题色彩系统', link: '/dev/color-brush-system/theme-colors' },
              ]
            },
            {
              text: 'PowerPoint 集成功能',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/ppt-integration/' },
                { text: '连接管理机制', link: '/dev/ppt-integration/connection-management' },
                { text: '事件处理系统', link: '/dev/ppt-integration/event-system' },
                { text: '同步机制实现', link: '/dev/ppt-integration/sync-mechanism' },
                { text: '故障处理与恢复', link: '/dev/ppt-integration/fault-recovery' },
              ]
            },
            { text: '手势识别与交互', link: '/dev/gesture-interaction' },
            { text: '形状绘制功能', link: '/dev/shape-drawing' },
            { text: '擦除功能系统', link: '/dev/eraser-system' },
          ]
        },
        { text: '插件系统架构', link: '/dev/plugin-architecture' },
        {
          text: '用户界面系统',
          collapsed: true,
          items: [
            { text: '概述', link: '/dev/ui-system/' },
            { text: '弹窗系统', link: '/dev/ui-system/popup-system' },
            { text: '多语言支持', link: '/dev/ui-system/multi-language' },
            { text: '主题系统', link: '/dev/ui-system/theme-system' },
            { text: '自定义控件库', link: '/dev/ui-system/custom-controls' },
          ]
        },
        {
          text: '系统架构设计',
          collapsed: true,
          items: [
            { text: '概述', link: '/dev/system-architecture/' },
            { text: '应用程序入口点', link: '/dev/system-architecture/app-entrypoint' },
            { text: '事件驱动架构', link: '/dev/system-architecture/event-driven' },
            { text: '监控与诊断系统', link: '/dev/system-architecture/monitoring-diagnostics' },
            {
              text: '全局服务架构',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/system-architecture/global-services/' },
                { text: '服务通信模式', link: '/dev/system-architecture/global-services/service-communication' },
                { text: '通知中心服务', link: '/dev/system-architecture/global-services/notification-service' },
                { text: '遥测服务', link: '/dev/system-architecture/global-services/telemetry-service' },
                { text: '异常处理服务', link: '/dev/system-architecture/global-services/exception-service' },
              ]
            },
            {
              text: '配置管理系统',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/system-architecture/config-management/' },
                { text: '动态配置更新', link: '/dev/system-architecture/config-management/dynamic-config' },
                { text: '配置安全与权限', link: '/dev/system-architecture/config-management/config-security' },
                { text: '配置文件管理', link: '/dev/system-architecture/config-management/config-files' },
                { text: '配置验证与迁移', link: '/dev/system-architecture/config-management/config-validation' },
              ]
            },
          ]
        },
        {
          text: '高级功能模块',
          collapsed: true,
          items: [
            { text: '概述', link: '/dev/advanced-modules/' },
            { text: '安全机制', link: '/dev/advanced-modules/security' },
            { text: '国际化与本地化', link: '/dev/advanced-modules/internationalization' },
            { text: '文件管理与存储', link: '/dev/advanced-modules/file-management' },
            { text: '性能监控与遥测', link: '/dev/advanced-modules/performance-telemetry' },
            { text: '异常处理与崩溃恢复', link: '/dev/advanced-modules/exception-recovery' },
          ]
        },
        {
          text: '开发者指南',
          collapsed: false,
          items: [
            { text: '开发者指南', link: '/dev/dev-guide/' },
            { text: '开发环境搭建', link: '/dev/dev-guide/environment-setup' },
            { text: '代码规范与最佳实践', link: '/dev/dev-guide/code-standards' },
            {
              text: '插件开发指南',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/dev-guide/plugin-dev/' },
                { text: '插件接口设计', link: '/dev/dev-guide/plugin-dev/interface-design' },
                { text: '插件生命周期管理', link: '/dev/dev-guide/plugin-dev/lifecycle' },
                { text: '插件宿主服务', link: '/dev/dev-guide/plugin-dev/host-service' },
                { text: '插件配置系统', link: '/dev/dev-guide/plugin-dev/config-system' },
                { text: '插件调试与测试', link: '/dev/dev-guide/plugin-dev/debugging' },
                { text: '插件打包与分发', link: '/dev/dev-guide/plugin-dev/packaging' },
              ]
            },
            {
              text: '自定义控件开发',
              collapsed: true,
              items: [
                { text: '概述', link: '/dev/dev-guide/custom-control-dev/' },
                { text: 'WPF 控件基础', link: '/dev/dev-guide/custom-control-dev/wpf-basics' },
                { text: '控件模板与样式', link: '/dev/dev-guide/custom-control-dev/templates-styles' },
                { text: '数据绑定与交互', link: '/dev/dev-guide/custom-control-dev/data-binding' },
                { text: '性能优化与最佳实践', link: '/dev/dev-guide/custom-control-dev/performance' },
              ]
            },
            { text: 'IACore 辅助程序开发', link: '/dev/dev-guide/iacore-helper' },
            { text: '调试与测试', link: '/dev/dev-guide/debugging-testing' },
            { text: '贡献流程', link: '/dev/dev-guide/contribution-process' },
          ]
        },
        {
          text: 'API 参考文档',
          collapsed: true,
          items: [
            { text: '概述', link: '/dev/api-reference/' },
            { text: 'IPC 通信 API', link: '/dev/api-reference/ipc-api' },
            { text: 'PowerPoint 集成 API', link: '/dev/api-reference/ppt-api' },
            { text: '插件 API', link: '/dev/api-reference/plugin-api' },
            { text: '工具栏 API', link: '/dev/api-reference/toolbar-api' },
            { text: '配置 API', link: '/dev/api-reference/config-api' },
          ]
        },
        {
          text: '部署与运维',
          collapsed: true,
          items: [
            { text: '概述', link: '/dev/deployment/' },
            { text: '构建与发布', link: '/dev/deployment/build-release' },
            { text: '系统部署', link: '/dev/deployment/system-deployment' },
            { text: '监控与维护', link: '/dev/deployment/monitoring-maintenance' },
            { text: '故障排除与支持', link: '/dev/deployment/troubleshooting-support' },
          ]
        },
        { text: '故障排除与常见问题', link: '/dev/troubleshooting' },
        { text: '贡献指南与社区', link: '/dev/community' },
        { text: 'URI 协议', link: '/dev/uri' },
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

  mermaid: {},

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
}));
