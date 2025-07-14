# 拖拽列表组件

除了提供 `v-drag-list` 指令外，我们还封装了一个开箱即用的 `DragList` 组件，以便更快速地实现拖拽功能。

## 基础用法

```vue
<script setup>
import { ref } from 'vue'
import { DragList } from 'vue3-drag-directive/components'

const list = ref([
  { id: 1, name: '项目1' },
  { id: 2, name: '项目2' },
  { id: 3, name: '项目3' }
])

const handleUpdate = (newList) => {
  console.log('列表已更新', newList)
}
</script>

<template>
  <DragList
    :list="list"
    @update="handleUpdate"
  >
    <template #item="{ item }">
      <div class="custom-item">
        {{ item.name }}
      </div>
    </template>
  </DragList>
</template>

<style>
.custom-item {
  padding: 12px;
  background: #f5f5f5;
  margin-bottom: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
```

## 组件属性

| 属性 | 类型 | 必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `list` | `Array` | 是 | - | 要拖拽的列表数据 |
| `itemKey` | `String` | 否 | `'id'` | 列表项的唯一标识字段 |
| `disabled` | `Boolean` | 否 | `false` | 是否禁用拖拽功能 |
| `animation` | `Boolean` | 否 | `true` | 是否启用动画效果 |
| `duration` | `Number` | 否 | `300` | 动画持续时间（毫秒） |
| `dragClass` | `String` | 否 | `'dragging'` | 拖拽中元素的类名 |
| `ghostClass` | `String` | 否 | `'ghost'` | 占位元素的类名 |
| `direction` | `String` | 否 | `'vertical'` | 拖拽方向，可选值：`'vertical'`、`'horizontal'` |
| `group` | `String` | 否 | - | 用于跨列表拖拽的分组名称 |

## 组件事件

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update` | `(newList: Array)` | 列表更新后触发 |
| `start` | `(event: Object)` | 开始拖拽时触发 |
| `move` | `(event: Object)` | 拖拽移动时触发 |
| `end` | `(event: Object)` | 拖拽结束时触发 |

## 组件插槽

| 插槽名 | 插槽属性 | 描述 |
| --- | --- | --- |
| `item` | `{ item, index }` | 自定义列表项的渲染内容 |
| `handle` | `{ item, index }` | 自定义拖拽把手 |

## 自定义拖拽把手

```vue
<template>
  <DragList :list="list" @update="handleUpdate">
    <template #item="{ item }">
      <div class="custom-item">
        {{ item.name }}
      </div>
    </template>
    <template #handle="{ item }">
      <div class="drag-handle">
        <i class="icon-drag"></i>
      </div>
    </template>
  </DragList>
</template>

<style>
.custom-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  margin-bottom: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.drag-handle {
  margin-right: 10px;
  cursor: move;
}

.icon-drag {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 18h8v2H8v-2zm0-4h8v2H8v-2zm0-4h8v2H8v-2zm0-4h8v2H8V6z" fill="%23999"/></svg>');
  background-size: contain;
}
</style>
```

## 横向列表

```vue
<template>
  <DragList
    :list="list"
    direction="horizontal"
    @update="handleUpdate"
    class="horizontal-list"
  >
    <template #item="{ item }">
      <div class="card-item">
        {{ item.name }}
      </div>
    </template>
  </DragList>
</template>

<style>
.horizontal-list {
  display: flex;
  overflow-x: auto;
  padding: 10px 0;
}

.card-item {
  flex: 0 0 150px;
  height: 100px;
  margin-right: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

## 跨列表拖拽

```vue
<script setup>
import { ref } from 'vue'
import { DragList } from 'vue3-drag-directive/components'

const todoList = ref([
  { id: 1, name: '待办任务1' },
  { id: 2, name: '待办任务2' }
])

const doneList = ref([
  { id: 3, name: '已完成任务1' },
  { id: 4, name: '已完成任务2' }
])

const handleTodoUpdate = (newList) => {
  todoList.value = newList
}

const handleDoneUpdate = (newList) => {
  doneList.value = newList
}
</script>

<template>
  <div class="kanban-board">
    <div class="kanban-column">
      <h3>待办任务</h3>
      <DragList
        :list="todoList"
        group="tasks"
        @update="handleTodoUpdate"
      >
        <template #item="{ item }">
          <div class="task-card">
            {{ item.name }}
          </div>
        </template>
      </DragList>
    </div>
    
    <div class="kanban-column">
      <h3>已完成任务</h3>
      <DragList
        :list="doneList"
        group="tasks"
        @update="handleDoneUpdate"
      >
        <template #item="{ item }">
          <div class="task-card done">
            {{ item.name }}
          </div>
        </template>
      </DragList>
    </div>
  </div>
</template>

<style>
.kanban-board {
  display: flex;
  gap: 20px;
}

.kanban-column {
  flex: 1;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.task-card {
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.done {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>
```

使用 `DragList` 组件可以更快速地实现拖拽功能，而不需要手动设置指令。这对于快速原型设计和简单场景非常有用。对于更复杂的场景，你可能仍然需要使用 `v-drag-list` 指令来获得更高的灵活性。