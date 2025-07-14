# 基础用法

## 简单示例

以下是一个基础的拖拽列表示例：

```vue
<script setup>
import { ref } from 'vue'

const list = ref([
  { id: 1, name: '项目1' },
  { id: 2, name: '项目2' },
  { id: 3, name: '项目3' },
  { id: 4, name: '项目4' }
])

const onUpdate = (detail) => {
  // 这里可以处理更新后的逻辑，例如发送请求到服务器
  console.log('从索引', detail.oldIndex, '移动到', detail.newIndex)
  console.log('更新后的列表', detail.list)
}
</script>

<template>
  <ul v-drag-list="{ list, onUpdate }">
    <li v-for="item in list" :key="item.id" class="drag-item">
      {{ item.name }}
    </li>
  </ul>
</template>

<style>
.drag-item {
  padding: 10px;
  background: #f5f5f5;
  margin-bottom: 5px;
  border: 1px solid #ddd;
  cursor: move;
}
</style>
```

## 指令参数

`v-drag-list` 指令接受一个对象作为参数，该对象可以包含以下属性：

| 属性 | 类型 | 必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `list` | `Array` | 是 | - | 要拖拽的列表数据 |
| `onUpdate` | `Function` | 否 | - | 列表更新后的回调函数 |
| `disabled` | `Boolean` | 否 | `false` | 是否禁用拖拽功能 |
| `animation` | `Boolean` | 否 | `true` | 是否启用动画效果 |
| `duration` | `Number` | 否 | `300` | 动画持续时间（毫秒） |
| `dragClass` | `String` | 否 | `'dragging'` | 拖拽中元素的类名 |
| `ghostClass` | `String` | 否 | `'ghost'` | 占位元素的类名 |
| `handle` | `String` | 否 | - | 拖拽把手的选择器 |
| `filter` | `String` | 否 | - | 不可拖拽元素的选择器 |

## 回调函数

`onUpdate` 回调函数会接收一个包含以下属性的对象：

```typescript
interface DragListUpdateDetail<T = any> {
  oldIndex: number;      // 拖拽元素的原始索引
  newIndex: number;      // 拖拽元素的新索引
  item: T;               // 被拖拽的元素
  list: T[];             // 更新后的列表数据
}
```

## 样式定制

你可以通过CSS来自定义拖拽元素的样式：

```css
/* 拖拽中的元素 */
.dragging {
  opacity: 0.8;
  background-color: #e6f7ff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 占位元素 */
.ghost {
  opacity: 0.5;
  background-color: #f0f0f0 !important;
  border: 1px dashed #1890ff;
}
```

## 使用拖拽把手

有时候你可能只想通过特定的元素（如图标）来触发拖拽：

```vue
<template>
  <ul v-drag-list="{ list, onUpdate, handle: '.handle' }">
    <li v-for="item in list" :key="item.id" class="drag-item">
      <span class="handle">☰</span>
      {{ item.name }}
    </li>
  </ul>
</template>

<style>
.handle {
  cursor: move;
  margin-right: 10px;
  color: #999;
}
</style>
```

## 禁用特定元素的拖拽

如果你想禁止某些元素被拖拽：

```vue
<template>
  <ul v-drag-list="{ list, onUpdate, filter: '.no-drag' }">
    <li v-for="item in list" :key="item.id" class="drag-item" :class="{ 'no-drag': item.locked }">
      {{ item.name }} {{ item.locked ? '(锁定)' : '' }}
    </li>
  </ul>
</template>
```

在下一节中，我们将探讨[高级用法](/guide/advanced-usage)，包括嵌套列表、横向拖拽等更复杂的场景。