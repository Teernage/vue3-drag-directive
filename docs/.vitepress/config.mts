import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/vue3-drag-directive/', // 确认这个是你的仓库名
  title: 'vue3-drag-directive',
  description: "A VitePress Site",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})