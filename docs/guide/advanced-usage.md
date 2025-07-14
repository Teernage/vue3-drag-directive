# 高级用法

## 横向拖拽列表

除了默认的纵向列表，`vue3-drag-directive` 也支持横向拖拽：

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
  console.log('列表已更新', detail)
}
</script>

<template>
  <div v-drag-list="{ list, onUpdate, direction: 'horizontal' }" class="horizontal-list">
    <div v-for="item in list" :key="item.id" class="drag-item">
      {{ item.name }}
    </div>
  </div>
</template>

<style>
.horizontal-list {
  display: flex;
  overflow-x: auto;
}

.drag-item {
  flex: 0 0 100px;
  height: 80px;
  margin-right: 10px;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}
</style>
```

## 嵌套列表

`vue3-drag-directive` 支持嵌套列表的拖拽，你可以在列表项中再包含子列表：

```vue
<script setup>
import { ref } from 'vue'

const list = ref([
  { 
    id: 1, 
    name: '分组1',
    children: [
      { id: '1-1', name: '项目1-1' },
      { id: '1-2', name: '项目1-2' }
    ]
  },
  { 
    id: 2, 
    name: '分组2',
    children: [
      { id: '2-1', name: '项目2-1' },
      { id: '2-2', name: '项目2-2' }
    ]
  }
])

const onUpdateGroup = (detail) => {
  console.log('分组列表已更新', detail)
}

const onUpdateItem = (groupId, detail) => {
  console.log(`分组 ${groupId} 的项目已更新`, detail)
}
</script>

<template>
  <ul v-drag-list="{ list, onUpdate: onUpdateGroup }" class="group-list">
    <li v-for="group in list" :key="group.id" class="group-item">
      <div class="group-header">{{ group.name }}</div>
      <ul v-drag-list="{ 
        list: group.children, 
        onUpdate: (detail) => onUpdateItem(group.id, detail),
        group: `group-${group.id}`
      }" class="item-list">
        <li v-for="item in group.children" :key="item.id" class="drag-item">
          {{ item.name }}
        </li>
      </ul>
    </li>
  </ul>
</template>

<style>
.group-list {
  padding: 0;
}

.group-item {
  margin-bottom: 20px;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.group-header {
  padding: 10px;
  background: #eee;
  font-weight: bold;
}

.item-list {
  padding: 10px;
}

.drag-item {
  padding: 8px;
  margin-bottom: 5px;
  background: white;
  border: 1px solid #ddd;
  cursor: move;
}
</style>
```

## 跨列表拖拽

你可以通过设置相同的 `group` 属性来实现跨列表拖拽：

```vue
<script setup>
import { ref } from 'vue'

const todoList = ref([
  { id: 1, name: '待办任务1' },
  { id: 2, name: '待办任务2' }
])

const doneList = ref([
  { id: 3, name: '已完成任务1' },
  { id: 4, name: '已完成任务2' }
])

const onUpdateTodo = (detail) => {
  console.log('待办列表已更新', detail)
}

const onUpdateDone = (detail) => {
  console.log('已完成列表已更新', detail)
}
</script>

<template>
  <div class="lists-container">
    <div class="list-wrapper">
      <h3>待办任务</h3>
      <ul v-drag-list="{ 
        list: todoList, 
        onUpdate: onUpdateTodo,
        group: 'tasks'
      }" class="task-list">
        <li v-for="item in todoList" :key="item.id" class="task-item">
          {{ item.name }}
        </li>
      </ul>
    </div>
    
    <div class="list-wrapper">
      <h3>已完成任务</h3>
      <ul v-drag-list="{ 
        list: doneList, 
        onUpdate: onUpdateDone,
        group: 'tasks'
      }" class="task-list">
        <li v-for="item in doneList" :key="item.id" class="task-item done">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
.lists-container {
  display: flex;
  gap: 20px;
}

.list-wrapper {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.task-list {
  min-height: 100px;
  padding: 0;
}

.task-item {
  padding: 10px;
  margin-bottom: 5px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  cursor: move;
}

.done {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>
```

## 自定义动画

你可以通过设置 `animation` 和 `duration` 属性来自定义拖拽动画：

```vue
<template>
  <ul v-drag-list="{ 
    list, 
    onUpdate,
    animation: true,
    duration: 500,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
  }">
    <li v-for="item in list" :key="item.id" class="drag-item">
      {{ item.name }}
    </li>
  </ul>
</template>
```

## 拖拽事件钩子

除了 `onUpdate` 回调外，`vue3-drag-directive` 还提供了多个事件钩子：

```vue
<template>
  <ul v-drag-list="{ 
    list,
    onStart: handleDragStart,
    onMove: handleDragMove,
    onEnd: handleDragEnd,
    onUpdate: handleUpdate,
    onSort: handleSort
  }">
    <li v-for="item in list" :key="item.id" class="drag-item">
      {{ item.name }}
    </li>
  </ul>
</template>

<script setup>
const handleDragStart = (evt) => {
  console.log('开始拖拽', evt.item)
  // 可以在这里添加额外的样式或逻辑
}

const handleDragMove = (evt) => {
  console.log('拖拽中', evt.related)
  // 可以在这里实现条件拖拽
}

const handleDragEnd = (evt) => {
  console.log('拖拽结束')
  // 可以在这里清理额外的状态
}

const handleUpdate = (detail) => {
  console.log('列表已更新', detail)
}

const handleSort = (evt) => {
  console.log('排序发生变化', evt.oldIndex, evt.newIndex)
}
</script>
```

## 与其他框架集成

`vue3-drag-directive` 可以与其他 UI 框架一起使用，例如 Element Plus、Ant Design Vue 等：

```vue
<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>拖拽排序</span>
      </div>
    </template>
    
    <el-list v-drag-list="{ list, onUpdate }">
      <el-list-item v-for="item in list" :key="item.id">
        <el-card shadow="hover" class="drag-card">
          {{ item.name }}
        </el-card>
      </el-list-item>
    </el-list>
  </el-card>
</template>
```

这些高级用法展示了 `vue3-drag-directive` 的灵活性和强大功能。你可以根据自己的需求组合使用这些特性，创建出功能丰富的拖拽交互界面。