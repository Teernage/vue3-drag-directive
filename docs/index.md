---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'vue3-drag-directive'
  text: 'Vue 3 拖拽指令'
  tagline: 轻量级、易用的 Vue 3 拖拽解决方案
  actions:
    - theme: brand
      text: 快速开始
      link: /markdown-examples
    - theme: alt
      text: GitHub
      link: https://github.com/teernage/vue3-drag-directive

features:
  - title: 🚀 轻量级
    details: 体积小巧，不会增加太多打包体积
  - title: 📱 易使用
    details: 简单的指令式 API，几行代码即可实现拖拽
  - title: 🎯 Vue 3 原生
    details: 专为 Vue 3 设计，完美支持组合式 API
---

## 快速开始

安装依赖：

```bash
npm install vue3-drag-directive
```

在你的 Vue 应用中使用：

```vue
<template>
  <div v-drag>拖拽我！</div>
</template>

<script setup>
import { vDrag } from 'vue3-drag-directive';
</script>
```
