import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Vue3 Drag Directive",
  description: "Vue3拖拽列表指令，轻量级、高性能的拖拽排序解决方案",
  base: '/vue3-drag-directive/', // 设置GitHub Pages的基础路径
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/' },
      { text: 'GitHub', link: 'https://github.com/yourusername/vue3-drag-directive' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '基础用法', link: '/guide/basic-usage' },
            { text: '高级用法', link: '/guide/advanced-usage' }
          ]
        }
      ],
      '/components/': [
        {
          text: '组件',
          items: [
            { text: '拖拽列表', link: '/components/' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/vue3-drag-directive' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present'
    }
  }
})