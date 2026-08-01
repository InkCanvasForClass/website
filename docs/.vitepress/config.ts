import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  base: '/website/',
  head: [
    ['link', { rel: 'icon', href: '/website/images/logo.png' }],
  ],
  locales: {
    cn: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/cn/',
      title: 'ICC CE',
      description: '智能课堂绘图增强工具',
      themeConfig: {
        nav: [
          { text: '<i class="fa-solid fa-house"></i> 首页', link: '/cn/' },
          { text: '<i class="fa-solid fa-book"></i> 指南', link: '/cn/guide/getting-started' },
          { text: '<i class="fa-solid fa-list-ul"></i> 功能', link: '/cn/features/overview' },
          { text: '<i class="fa-solid fa-code"></i> 开发', link: '/cn/dev/' },
          { text: '<i class="fa-solid fa-download"></i> 下载', link: '/cn/download' },
          { text: '<i class="fa-solid fa-globe"></i> 官网', link: 'https://inkcanvasforclass.github.io/' },
          { text: '<i class="fa-brands fa-github"></i> 源码仓库', link: 'https://github.com/InkCanvasForClass/community' }
        ],
        sidebar: {
          '/cn/guide/': [
            {
              text: '入门指南',
              items: [
                { text: '快速开始', link: '/cn/guide/getting-started' },
                { text: '安装与更新通道', link: '/cn/guide/installation' },
                { text: '手势与快捷操作', link: '/cn/guide/gestures-shortcuts' },
                { text: 'PPT 联动指南', link: '/cn/guide/ppt-guide' },
                { text: 'URL 命令调用', link: '/cn/guide/url-commands' },
                { text: '配置文件与数据目录', link: '/cn/guide/files-and-data' },
                { text: '高级技巧', link: '/cn/guide/advanced-tips' },
                { text: '设置指南', link: '/cn/guide/settings' },
                { text: '常见问题', link: '/cn/guide/faq' },
                { text: '故障排除', link: '/cn/guide/troubleshooting' },
                { text: '使用指南', link: '/cn/guide/instruction-manual' },
              ],
            },
          ],
          '/cn/features/': [
            {
              text: '功能文档',
              collapsed: false,
              items: [
                { text: '功能概览', link: '/cn/features/overview' },
              ],
            },
          ],
          '/cn/dev/': [
            { text: '开发文档总览', link: '/cn/dev/' },
            {
              text: '起步',
              collapsed: false,
              items: [
                { text: '开发环境', link: '/cn/dev/getting-started/environment' },
                { text: '解决方案结构', link: '/cn/dev/getting-started/solution-layout' },
                { text: '构建与运行', link: '/cn/dev/getting-started/build-and-run' },
                { text: '参与贡献', link: '/cn/dev/getting-started/contributing' },
              ]
            },
            {
              text: '应用核心',
              collapsed: false,
              items: [
                { text: '启动流程', link: '/cn/dev/core/startup' },
                { text: '主窗口', link: '/cn/dev/core/mainwindow' },
                { text: '设置系统', link: '/cn/dev/core/settings' },
                { text: '墨迹系统', link: '/cn/dev/core/inking' },
                { text: '工具栏系统', link: '/cn/dev/core/toolbar' },
                { text: 'PPT 联动', link: '/cn/dev/core/ppt' },
                { text: '自动化系统', link: '/cn/dev/core/automation' },
                { text: 'URI 协议调用', link: '/cn/dev/core/uri' },
                { text: '代码规范', link: '/cn/dev/core/conventions' },
              ]
            },
            {
              text: '插件开发',
              collapsed: false,
              items: [
                { text: '概述', link: '/cn/dev/plugin/overview' },
                { text: '快速开始', link: '/cn/dev/plugin/quickstart' },
                { text: '清单文件', link: '/cn/dev/plugin/manifest' },
                { text: '生命周期', link: '/cn/dev/plugin/lifecycle' },
                { text: '宿主服务', link: '/cn/dev/plugin/host-services' },
                { text: '界面集成', link: '/cn/dev/plugin/ui-integration' },
                { text: '打包分发', link: '/cn/dev/plugin/packaging' },
                { text: '调试排错', link: '/cn/dev/plugin/debugging' },
              ]
            },
          ]
        },
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
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'ICC CE',
      description: 'Smart Classroom Drawing Enhancement Tool',
      themeConfig: {
        nav: [
          { text: '<i class="fa-solid fa-house"></i> Home', link: '/en/' },
          { text: '<i class="fa-solid fa-book"></i> Guide', link: '/en/guide/getting-started' },
          { text: '<i class="fa-solid fa-list-ul"></i> Features', link: '/en/features/overview' },
          { text: '<i class="fa-solid fa-code"></i> Development', link: '/en/dev/project-structure' },
          { text: '<i class="fa-solid fa-download"></i> Download', link: '/en/download' },
          { text: '<i class="fa-solid fa-globe"></i> Official Site', link: 'https://inkcanvasforclass.github.io/' },
          { text: '<i class="fa-brands fa-github"></i> Repository', link: 'https://github.com/InkCanvasForClass/community' }
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/en/guide/getting-started' },
                { text: 'Installation & Update Channels', link: '/en/guide/installation' },
                { text: 'Gestures & Shortcuts', link: '/en/guide/gestures-shortcuts' },
                { text: 'PowerPoint Guide', link: '/en/guide/ppt-guide' },
                { text: 'Files & Data Locations', link: '/en/guide/files-and-data' },
                { text: 'Advanced Tips', link: '/en/guide/advanced-tips' },
                { text: 'Settings Guide', link: '/en/guide/settings' },
                { text: 'FAQ', link: '/en/guide/faq' },
                { text: 'Troubleshooting', link: '/en/guide/troubleshooting' },
                { text: 'Instruction Manual', link: '/en/guide/instruction-manual' },
              ],
            },
          ],
          '/en/features/': [
            {
              text: 'Features',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/en/features/overview' },
              ],
            },
          ],
          '/en/dev/': [
            { text: 'Repository Structure', link: '/en/dev/project-structure' },
            {
              text: 'Core Modules',
              collapsed: false,
              items: [
                { text: 'Core Modules Overview', link: '/en/dev/core-modules' },
                {
                  text: 'Whiteboard System',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/whiteboard-system/' },
                    { text: 'InkCanvas Core Component', link: '/en/dev/whiteboard-system/inkcanvas-core' },
                    { text: 'Ink Smoothing', link: '/en/dev/whiteboard-system/ink-smoothing' },
                    { text: 'Ink Fadeout Effect', link: '/en/dev/whiteboard-system/ink-fadeout' },
                    { text: 'Color & Brush Management', link: '/en/dev/whiteboard-system/color-brush-management' },
                    { text: 'Page & Canvas Management', link: '/en/dev/whiteboard-system/page-canvas-management' },
                  ]
                },
                {
                  text: 'Toolbar System',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/toolbar-system/' },
                    { text: 'Architecture Design', link: '/en/dev/toolbar-system/architecture' },
                    { text: 'Toolbar Item Implementation', link: '/en/dev/toolbar-system/item-implementation' },
                    { text: 'Registry', link: '/en/dev/toolbar-system/registry' },
                    { text: 'Customization & Extension', link: '/en/dev/toolbar-system/customization' },
                  ]
                },
                { text: 'Page Management', link: '/en/dev/page-management' },
                {
                  text: 'Color & Brush System',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/color-brush-system/' },
                    { text: 'Brush Type Management', link: '/en/dev/color-brush-system/brush-types' },
                    { text: 'Brush Effect Adjustments', link: '/en/dev/color-brush-system/brush-effects' },
                    { text: 'Color Picker', link: '/en/dev/color-brush-system/color-picker' },
                    { text: 'Theme Color System', link: '/en/dev/color-brush-system/theme-colors' },
                  ]
                },
                {
                  text: 'PowerPoint Integration',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/ppt-integration/' },
                    { text: 'Connection Management', link: '/en/dev/ppt-integration/connection-management' },
                    { text: 'Event System', link: '/en/dev/ppt-integration/event-system' },
                    { text: 'Sync Mechanism', link: '/en/dev/ppt-integration/sync-mechanism' },
                    { text: 'Fault Recovery', link: '/en/dev/ppt-integration/fault-recovery' },
                  ]
                },
                { text: 'Gesture & Interaction', link: '/en/dev/gesture-interaction' },
                { text: 'Shape Drawing', link: '/en/dev/shape-drawing' },
                { text: 'Eraser System', link: '/en/dev/eraser-system' },
              ]
            },
            { text: 'Plugin Architecture', link: '/en/dev/plugin-architecture' },
            {
              text: 'UI System',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/en/dev/ui-system/' },
                { text: 'Popup System', link: '/en/dev/ui-system/popup-system' },
                { text: 'Multi-language Support', link: '/en/dev/ui-system/multi-language' },
                { text: 'Theme System', link: '/en/dev/ui-system/theme-system' },
                { text: 'Custom Controls Library', link: '/en/dev/ui-system/custom-controls' },
              ]
            },
            {
              text: 'System Architecture',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/en/dev/system-architecture/' },
                { text: 'Application Entrypoint', link: '/en/dev/system-architecture/app-entrypoint' },
                { text: 'Event-driven Architecture', link: '/en/dev/system-architecture/event-driven' },
                { text: 'Monitoring & Diagnostics', link: '/en/dev/system-architecture/monitoring-diagnostics' },
                {
                  text: 'Global Services',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/system-architecture/global-services/' },
                    { text: 'Service Communication', link: '/en/dev/system-architecture/global-services/service-communication' },
                    { text: 'Notification Service', link: '/en/dev/system-architecture/global-services/notification-service' },
                    { text: 'Telemetry Service', link: '/en/dev/system-architecture/global-services/telemetry-service' },
                    { text: 'Exception Service', link: '/en/dev/system-architecture/global-services/exception-service' },
                  ]
                },
                {
                  text: 'Configuration Management',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/system-architecture/config-management/' },
                    { text: 'Dynamic Config Updates', link: '/en/dev/system-architecture/config-management/dynamic-config' },
                    { text: 'Config Security & Permissions', link: '/en/dev/system-architecture/config-management/config-security' },
                    { text: 'Config File Management', link: '/en/dev/system-architecture/config-management/config-files' },
                    { text: 'Config Validation & Migration', link: '/en/dev/system-architecture/config-management/config-validation' },
                  ]
                },
              ]
            },
            {
              text: 'Advanced Modules',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/en/dev/advanced-modules/' },
                { text: 'Security Mechanism', link: '/en/dev/advanced-modules/security' },
                { text: 'Internationalization', link: '/en/dev/advanced-modules/internationalization' },
                { text: 'File Management & Storage', link: '/en/dev/advanced-modules/file-management' },
                { text: 'Performance Monitoring', link: '/en/dev/advanced-modules/performance-telemetry' },
                { text: 'Exception & Crash Recovery', link: '/en/dev/advanced-modules/exception-recovery' },
              ]
            },
            {
              text: 'Developer Guide',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/en/dev/dev-guide/' },
                { text: 'Setup Environment', link: '/en/dev/dev-guide/environment-setup' },
                { text: 'Code Standards', link: '/en/dev/dev-guide/code-standards' },
                {
                  text: 'Plugin Development',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/dev-guide/plugin-dev/' },
                    { text: 'Interface Design', link: '/en/dev/dev-guide/plugin-dev/interface-design' },
                    { text: 'Lifecycle Management', link: '/en/dev/dev-guide/plugin-dev/lifecycle' },
                    { text: 'Host Service', link: '/en/dev/dev-guide/plugin-dev/host-service' },
                    { text: 'Config System', link: '/en/dev/dev-guide/plugin-dev/config-system' },
                    { text: 'Debugging & Testing', link: '/en/dev/dev-guide/plugin-dev/debugging' },
                    { text: 'Packaging & Distribution', link: '/en/dev/dev-guide/plugin-dev/packaging' },
                  ]
                },
                {
                  text: 'Custom Controls Development',
                  collapsed: true,
                  items: [
                    { text: 'Overview', link: '/en/dev/dev-guide/custom-control-dev/' },
                    { text: 'WPF Controls Basics', link: '/en/dev/dev-guide/custom-control-dev/wpf-basics' },
                    { text: 'Templates & Styles', link: '/en/dev/dev-guide/custom-control-dev/templates-styles' },
                    { text: 'Data Binding & Interaction', link: '/en/dev/dev-guide/custom-control-dev/data-binding' },
                    { text: 'Performance & Best Practices', link: '/en/dev/dev-guide/custom-control-dev/performance' },
                  ]
                },
                { text: 'IACore Helper Development', link: '/en/dev/dev-guide/iacore-helper' },
                { text: 'Debugging & Testing', link: '/en/dev/dev-guide/debugging-testing' },
                { text: 'Contribution Process', link: '/en/dev/dev-guide/contribution-process' },
              ]
            },
            {
              text: 'API Reference',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/en/dev/api-reference/' },
                { text: 'IPC API', link: '/en/dev/api-reference/ipc-api' },
                { text: 'PowerPoint API', link: '/en/dev/api-reference/ppt-api' },
                { text: 'Plugin API', link: '/en/dev/api-reference/plugin-api' },
                { text: 'Toolbar API', link: '/en/dev/api-reference/toolbar-api' },
                { text: 'Config API', link: '/en/dev/api-reference/config-api' },
              ]
            },
            {
              text: 'Deployment & Maintenance',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/en/dev/deployment/' },
                { text: 'Build & Release', link: '/en/dev/deployment/build-release' },
                { text: 'Versioning Scheme', link: '/en/dev/deployment/versioning' },
                { text: 'Publishing SDK to NuGet', link: '/en/dev/deployment/nuget-publishing' },
                { text: 'System Deployment', link: '/en/dev/deployment/system-deployment' },
                { text: 'Monitoring & Maintenance', link: '/en/dev/deployment/monitoring-maintenance' },
                { text: 'Troubleshooting & Support', link: '/en/dev/deployment/troubleshooting-support' },
              ]
            },
            { text: 'Troubleshooting & FAQ', link: '/en/dev/troubleshooting' },
            { text: 'Contribution & Community', link: '/en/dev/community' },
            { text: 'URI Protocol', link: '/en/dev/uri' },
          ]
        },
        footer: {
          message: 'Released under the GPLv3 License',
          copyright: 'Copyright © 2023-present ICC-CE Team',
        },
        outline: {
          level: [2, 3],
          label: 'On this page'
        },
        editLink: {
          pattern: 'https://github.com/InkCanvasForClass/website/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
        },
        docFooter: {
          prev: 'Previous page',
          next: 'Next page'
        },
        lastUpdated: {
          text: 'Last updated'
        },
        notFound: {
          title: 'PAGE NOT FOUND',
          quote: "But if you don't change your direction, and if you keep looking, you may end up where you are heading.",
          linkLabel: 'Go to home page',
          linkText: 'Take me home'
        },
        langMenuLabel: 'Languages',
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        skipToContentLabel: 'Skip to content'
      }
    }
  },
  themeConfig: {
    logo: '/images/logo.png',
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
    search: {
      provider: "local",
      options: {
        locales: {
          cn: {
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
          en: {
            translations: {
              button: {
                buttonText: "Search Docs",
                buttonAriaLabel: "Search Docs",
              },
              modal: {
                noResultsText: "No results found",
                resetButtonTitle: "Clear search query",
                footer: {
                  selectText: "Select",
                  navigateText: "Navigate",
                  closeText: "Close",
                },
              },
            },
          },
        },
      },
    },
  },

  cleanUrls: true,

  srcExclude: ['**/_HANDOFF.md'],

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
