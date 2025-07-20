# 高级用法

## 嵌套列表

`vue3-drag-directive` 支持多层级嵌套列表的拖拽功能，让你可以构建复杂的树形结构拖拽界面。

## 基本概念

嵌套列表拖拽允许你在多层级的列表结构中进行拖拽排序，每个层级都可以独立进行拖拽操作，非常适合项目管理、文件目录、组织架构等场景。

### 🎬 在线演示

<Demo>
  <NestedListsDemo />
<template #code>

```vue
<template>
  <div class="nested-drag-container">
    <!-- 一级列表 -->
    <div
      class="drag-list-container level-1"
      v-drag-list="{
        list: mainList,
        canDrag: true,
        dragItemClass: 'app-item',
        dragHandleClass: 'drag-handle',
      }"
      @drag-mode-start="onDragStart"
      @drag-mode-end="onMainListDragEnd"
    >
      <div
        v-for="item in mainList"
        :key="item.id"
        :data-id="item.id"
        class="app-item main-item"
        :class="{ 'has-children': item.children && item.children.length > 0 }"
      >
        <div class="item-header">
          <div class="drag-handle">⋮⋮</div>
          <div class="item-content">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
          <div
            v-if="item.children && item.children.length > 0"
            class="item-actions"
          >
            <button @click="toggleExpand(item)" class="expand-btn">
              {{ item.expanded ? '▼' : '▶' }}
            </button>
          </div>
        </div>

        <!-- 二级列表 -->
        <div
          v-if="item.expanded && item.children && item.children.length > 0"
          class="drag-list-container level-2"
          v-drag-list="{
            list: item.children,
            canDrag: true,
            dragItemClass: 'app-item',
            dragHandleClass: 'drag-handle',
          }"
          @drag-mode-start="onDragStart"
          @drag-mode-end="(e) => onChildListDragEnd(e, item)"
        >
          <div
            v-for="child in item.children"
            :key="child.id"
            :data-id="child.id"
            class="app-item child-item"
            :class="{
              'has-children': child.children && child.children.length > 0,
            }"
          >
            <div class="item-header">
              <div class="drag-handle">⋮⋮</div>
              <div class="item-content">
                <h4>{{ child.title }}</h4>
                <p>{{ child.description }}</p>
              </div>
              <div class="item-actions">
                <button
                  v-if="child.children.length > 0"
                  @click="toggleExpand(child)"
                  class="expand-btn"
                >
                  {{ child.expanded ? '▼' : '▶' }}
                </button>
              </div>
            </div>

            <!-- 三级列表 -->
            <div
              v-if="
                child.expanded && child.children && child.children.length > 0
              "
              class="drag-list-container level-3"
              v-drag-list="{
                list: child.children,
                canDrag: true,
                dragItemClass: 'app-item',
                dragHandleClass: 'drag-handle',
              }"
              @drag-mode-start="onDragStart"
              @drag-mode-end="(e) => onGrandChildListDragEnd(e, child)"
            >
              <div
                v-for="grandChild in child.children"
                :key="grandChild.id"
                :data-id="grandChild.id"
                class="app-item grandchild-item"
              >
                <div class="item-header">
                  <div class="drag-handle">⋮⋮</div>
                  <div class="item-content">
                    <h5>{{ grandChild.title }}</h5>
                    <p>{{ grandChild.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { vDragList } from 'vue3-drag-directive';

// 示例数据
const mainList = ref([
  {
    id: '1',
    title: '项目 A',
    description: '这是项目 A 的描述',
    expanded: true,
    children: [
      {
        id: '1-2',
        title: '子任务 A-2',
        description: '这是子任务 A-2 的描述',
        expanded: false,
        children: [],
      },
      {
        id: '1-1',
        title: '子任务 A-1',
        description: '这是子任务 A-1 的描述',
        expanded: true,
        children: [
          {
            id: '1-1-1',
            title: '子子任务 A-1-1',
            description: '最深层任务',
          },
          {
            id: '1-1-2',
            title: '子子任务 A-1-2',
            description: '最深层任务',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '项目 B',
    description: '这是项目 B 的描述',
    expanded: false,
    children: [
      {
        id: '2-1',
        title: '子任务 B-1',
        description: '这是子任务 B-1 的描述',
        expanded: false,
        children: [],
      },
    ],
  },
  {
    id: '3',
    title: '项目 C',
    description: '这是项目 C 的描述',
    expanded: false,
    children: [],
  },
]);

/**
 * 拖拽开始事件处理函数
 *
 * @param e 事件对象
 */
const onDragStart = (e) => {
  console.log('拖拽开始:', e.detail);
};

/**
 * 主列表拖拽结束事件处理函数
 *
 * @param e 事件对象，包含拖拽结束后的详细信息
 */
const onMainListDragEnd = (e) => {
  console.log('主列表拖拽结束:', e.detail);
  mainList.value = e.detail.updatedData;
};

/**
 * 子列表拖拽结束处理函数
 *
 * @param e 事件对象
 * @param parentItem 父级项对象
 */
const onChildListDragEnd = (e, parentItem) => {
  console.log('子列表拖拽结束:', e.detail);
  parentItem.children = e.detail.updatedData;
};

/**
 * 处理孙列表拖拽结束事件
 *
 * @param e 事件对象
 * @param parentItem 父项对象
 */
const onGrandChildListDragEnd = (e, parentItem) => {
  console.log('孙列表拖拽结束:', e.detail);
  parentItem.children = e.detail.updatedData;
};

/**
 * 切换项目的展开/收起状态
 *
 * @param item 要切换状态的项
 */
const toggleExpand = (item) => {
  item.expanded = !item.expanded;
};
</script>

<style scoped>
.nested-drag-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.drag-list-container {
  min-height: 50px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  margin: 5px 0;
  background-color: #fafafa;
}

.drag-list-container.level-1 {
  border-color: #2196f3;
  background-color: #f3f9ff;
}

.drag-list-container.level-2 {
  border-color: #4caf50;
  background-color: #f1f8e9;
  margin-left: 20px;
}

.drag-list-container.level-3 {
  border-color: #ff9800;
  background-color: #fff3e0;
  margin-left: 20px;
}

.app-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin: 8px 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.app-item.has-children {
  border-left: 4px solid #2196f3;
}

.item-header {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
}

.drag-handle {
  cursor: grab;
  color: #666;
  font-weight: bold;
  user-select: none;
  padding: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.item-content {
  flex: 1;
}

.item-content h3,
.item-content h4,
.item-content h5 {
  margin: 0 0 4px 0;
  color: #333;
}

.item-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-actions button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.expand-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.expand-btn:hover {
  background: #bbdefb;
}

.main-item {
  border-left: 4px solid #2196f3;
}

.child-item {
  border-left: 4px solid #4caf50;
}

.grandchild-item {
  border-left: 4px solid #ff9800;
}
</style>
```

  </template>
</Demo>

### 实现要点

#### 1. 数据结构

嵌套列表需要包含 children 字段来表示子项：

```js
const listData = {
  id: 'unique-id', // 必需：唯一标识符
  title: '项目名称', // 显示内容
  expanded: true, // 展开状态
  children: [], // 子项数组
};
```

#### 2. 多层级指令配置

每个层级都需要独立的 v-drag-list 指令：

```js
<!-- 主列表 -->
<div v-drag-list="{ list: mainList, ... }">
  <!-- 子列表 -->
  <div v-drag-list="{ list: item.children, ... }">
    <!-- 更深层级... -->
  </div>
</div>

```

#### 3. 事件处理

不同层级需要不同的事件处理函数：

```js
// 主列表拖拽结束
const onMainListDragEnd = (e) => {
  mainList.value = e.detail.updatedData;
};

// 子列表拖拽结束
const onChildListDragEnd = (e, parentItem) => {
  parentItem.children = e.detail.updatedData;
};
```

### 配置选项

所有基础配置选项都适用于嵌套列表，每个层级可以有不同的配置：

```js
const dragConfig = {
  list: listData, // 当前层级的数据
  canDrag: true, // 是否允许拖拽
  dragItemClass: 'app-item', // 拖拽项的类名
  dragHandleClass: 'drag-handle', // 拖拽手柄的类名
};
```
