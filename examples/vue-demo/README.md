# 方式 1： 在项目中直接使用指令源代码的方式：

## npm install

## npm run dev 运行项目即可看到效果。

# 方式 2： 通过 npm 包安装自定义拖拽指令的方式：

## 安装 下载拖拽指令

### 使用 npm

npm install vue3-drag-directive

### 使用 yarn

yarn add vue3-drag-directive

### 使用 pnpm

pnpm add vue3-drag-directive

## 使用方式

1. 全局注册

在应用入口文件（通常是 main.js 或 main.ts）中注册：

```ts
import { createApp } from 'vue';
import DragListPlugin from 'vue3-drag-directive';
import App from './App.vue';

const app = createApp(App);

// 使用默认配置
app.use(DragListPlugin);

// 或者使用自定义配置
app.use(DragListPlugin, {
  name: 'custom-drag-list', // 自定义指令名称，默认为 'drag-list'
});

app.mount('#app');
```

全局注册后，可以在任何组件中使用该指令：

```vue
<template>
  <div
    v-drag-list="{ list: items, canDrag: isEditable }"
    @drag-mode-end="handleDragListUpdated"
    @drag-mode-start="onDragModeStart"
  >
    <div
      v-for="item in items"
      :key="item.id"
      :data-id="item.id"
      class="app-item"
    >
      {{ item.name }}
    </div>
  </div>
</template>
```

2. 局部注册（按需引入）
   在单个组件中注册使用：

```vue
<template>
  <div
    v-drag-list="{ list: items, canDrag: isEditable }"
    @drag-mode-end="handleDragEnd"
  >
    <div
      v-for="item in items"
      :key="item.id"
      :data-id="item.id"
      class="app-item"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 正确的导入方式：使用 v 前缀
import { vDragList } from 'vue3-drag-directive';

const items = ref([
  { id: 1, name: '项目 1' },
  { id: 2, name: '项目 2' },
  { id: 3, name: '项目 3' },
]);
const isEditable = ref(true);

const handleDragEnd = (event) => {
  items.value = event.detail.updatedData;
};
```
