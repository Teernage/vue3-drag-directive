# 基础用法

本节将介绍 vue3-drag-directive 的基本用法和配置选项。通过示例，你将了解如何快速使用列表拖拽功能。

## 🎬 在线演示

以下是一个更直观的九宫格拖拽演示，展示了如何在网格布局中实现拖拽排序：

<Demo>
  <DragListDemo />

<template #code>

```vue
<template>
  <div class="container">
    <div class="header">
      <h1>{{ title }}</h1>
      <p>可以拖拽九宫格中的任意方块 - 颜色固定不变</p>
    </div>
    <div
      class="grid-container"
      v-drag-list="{
        list: gridItems,
        canDrag: true,
        dragItemClass: 'app-item',
      }"
      @drag-mode-end="handleDragModeEnd"
      @drag-mode-start="onDragModeStart"
    >
      <div
        v-for="item in gridItems"
        :key="item.id"
        :data-id="item.id"
        class="app-item"
      >
        {{ item.id }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { vDragList } from 'vue3-drag-directive';

const title = ref('九宫格');

const gridItems = reactive(
  Array.from({ length: 9 }, (_, index) => ({
    id: `item-${index + 1}`,
  }))
);

function onDragModeStart() {
  console.log('拖拽开始');
}

function handleDragModeEnd(event) {
  const { draggedItemData, updatedData } = event.detail;
  console.log('拖拽完成', { draggedItemData, updatedData });
}
</script>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 15px;
  max-width: 450px;
  margin: 0 auto;
  aspect-ratio: 1;
}

.app-item {
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 各个方块的颜色样式 */
.app-item[data-id='item-1'] {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}
.app-item[data-id='item-2'] {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}
.app-item[data-id='item-3'] {
  background: linear-gradient(135deg, #45b7d1, #96c93d);
}
.app-item[data-id='item-4'] {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.app-item[data-id='item-5'] {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.app-item[data-id='item-6'] {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}
.app-item[data-id='item-7'] {
  background: linear-gradient(135deg, #fa709a, #fee140);
}
.app-item[data-id='item-8'] {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
}
.app-item[data-id='item-9'] {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
</style>
```

  </template>
</Demo>

## 指令参数详解

`v-drag-list` 指令接受一个对象作为参数，该对象可以包含以下属性：

| 属性            | 类型      | 必填 | 默认值       | 描述             |
| --------------- | --------- | ---- | ------------ | ---------------- |
| `list`          | `Array`   | 是   | -            | 要拖拽的列表数据 |
| `canDrag`       | `Boolean` | 否   | `true`       | 是否启用拖拽功能 |
| `dragItemClass` | `String`  | 否   | `'app-item'` | 可拖拽项的类名   |

## 事件

| 事件名            | 描述           | 回调参数                                                             |
| ----------------- | -------------- | -------------------------------------------------------------------- |
| `drag-mode-start` | 拖拽开始时触发 | 拖拽开始的事件对象                                                   |
| `drag-mode-end`   | 拖拽结束时触发 | 包含最新列表数据 `updatedData` 和拖拽项 `draggedItemData` 的事件对象 |

示例：

```vue
<template>
  <ul
    v-drag-list="{ list }"
    @drag-mode-start="onDragStart"
    @drag-mode-end="onDragEnd"
  >
    <li v-for="item in list" :key="item.id" :data-id="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>

<script setup>
const onDragStart = () => {
  console.log('拖拽开始');
};

const onDragEnd = (event) => {
  const { updatedData, draggedItemData } = event.detail;
  console.log('拖拽结束', updatedData);
  console.log('被拖拽的项目', draggedItemData);
};
</script>
```

## 样式定制

拖拽指令会自动为正在拖拽的元素添加 `vue-drag-list-directive__dragging` 类，你可以通过 CSS 来自定义拖拽元素的样式：

```css
/* 拖拽中的元素 */
.vue-drag-list-directive__dragging {
  opacity: 0;
  background-color: transparent;
}
```

## 注意事项

1. **数据项必须有唯一 ID**：每个列表项必须有一个唯一的 `id` 属性，用于跟踪拖拽操作。

2. **DOM 元素需要 data-id 属性**：对应的 DOM 元素需要设置 `data-id` 属性，其值应与数据项的 `id` 相匹配。

3. **响应式更新**：当列表数据发生变化时，拖拽功能会自动重新初始化。

在下一节中，我们将探讨[高级用法](/guide/advanced-usage)，包括嵌套列表、横向拖拽等更复杂的场景。
