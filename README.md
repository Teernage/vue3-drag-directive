# Vue Drag List 指令使用文档

vue-drag-list 是一个轻量级的 Vue3 拖拽指令，提供了列表项的拖拽排序功能，支持平滑的 flip 动画效果。本文档将详细介绍如何安装和使用这个指令。

## 安装

### 使用 npm

npm install vue-drag-list

### 使用 yarn

yarn add vue-drag-list

### 使用 pnpm

pnpm add vue-drag-list

## 使用方式

1. 全局注册

在应用入口文件（通常是 main.js 或 main.ts）中注册：

```ts
import { createApp } from 'vue';
import DragListPlugin from 'vue-drag-list';
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
import { vDragList } from 'vue-drag-list';

const items = ref([
  { id: 1, name: '项目 1' },
  { id: 2, name: '项目 2' },
  { id: 3, name: '项目 3' },
]);
const isEditable = ref(true);

const handleDragEnd = (event) => {
  items.value = event.detail.updatedData;
};
</script>
```

## 指令参数

v-drag-list 指令接受一个对象作为参数，包含以下属性：

| 参数 | 类型 | 必填 | 默认值 | 描述 | |------|------|------|--------|------| | list   | Array | 是 | - | 要排序的数据列表，每个 item 项必须包含唯一的 id 属性 | | canDrag | Boolean | 否 | true | 是否启用拖拽功能 |
