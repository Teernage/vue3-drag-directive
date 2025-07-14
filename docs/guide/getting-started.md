# 快速开始

## 安装

### NPM

```bash
npm install vue3-drag-directive --save
```

### Yarn

```bash
yarn add vue3-drag-directive
```

### PNPM

```bash
pnpm add vue3-drag-directive
```

## 注册指令

### 全局注册

在你的 `main.js` 或 `main.ts` 文件中：

```js
import { createApp } from 'vue'
import App from './App.vue'
import DragListPlugin from 'vue3-drag-directive'

const app = createApp(App)

// 使用默认配置
app.use(DragListPlugin)

// 或者自定义指令名称
app.use(DragListPlugin, { name: 'my-drag' })

app.mount('#app')
```

### 局部注册

在你的组件中：

```vue
<script setup>
import { vDragList } from 'vue3-drag-directive'

const list = ref([
  { id: 1, name: '项目1' },
  { id: 2, name: '项目2' },
  { id: 3, name: '项目3' }
])

const onUpdate = (detail) => {
  console.log('列表已更新', detail)
}
</script>

<template>
  <ul v-drag-list="{ list, onUpdate }">
    <li v-for="item in list" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

### 通过 CDN 使用

```html
<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/vue3-drag-directive"></script>

<div id="app">
  <ul v-drag-list="{ list, onUpdate }">
    <li v-for="item in list" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</div>

<script>
  const { createApp, ref } = Vue
  
  createApp({
    setup() {
      const list = ref([
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' },
        { id: 3, name: '项目3' }
      ])
      
      const onUpdate = (detail) => {
        console.log('列表已更新', detail)
      }
      
      return { list, onUpdate }
    }
  }).mount('#app')
</script>
```

## 下一步

现在你已经成功安装并注册了 vue3-drag-directive，请继续阅读[基础用法](/guide/basic-usage)章节，了解更多使用细节。