<template>
  <div class="list-container">
    <div
      v-drag-list="{
        list: items,
        canDrag: true,
        dragItemClass: 'app-item',
        dragHandleClass: 'drag-handle',
      }"
      @drag-mode-end="handleDragEnd"
    >
      <div
        v-for="item in items"
        :key="item.id"
        :data-id="item.id"
        class="app-item"
        :class="`color-${item.colorIndex}`"
      >
        <!-- 拖拽手柄 -->
        <div class="drag-handle">⋮⋮</div>

        <!-- 内容区域 -->
        <div class="item-content">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { vDragList } from 'vue3-drag-directive';

const items = ref([
  {
    id: '1',
    title: '项目一',
    description: '这是第一个项目的描述',
    colorIndex: 1,
  },
  {
    id: '2',
    title: '项目二',
    description: '这是第二个项目的描述',
    colorIndex: 2,
  },
  {
    id: '3',
    title: '项目三',
    description: '这是第三个项目的描述',
    colorIndex: 3,
  },
]);

function handleDragEnd(event) {
  console.log('拖拽完成', event.detail.updatedData);
}
</script>

<style scoped>
.list-container {
  max-width: 600px;
  margin: 0 auto;
}

.app-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 8px 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.app-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 颜色主题 */
.app-item.color-1 {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8fffe 100%);
  border-left: 4px solid #2196f3;
}

.app-item.color-2 {
  background: linear-gradient(135deg, #f1f8e9 0%, #fefffe 100%);
  border-left: 4px solid #4caf50;
}

.app-item.color-3 {
  background: linear-gradient(135deg, #fff3e0 0%, #fffffe 100%);
  border-left: 4px solid #ff9800;
}

.app-item.color-4 {
  background: linear-gradient(135deg, #fce4ec 0%, #fffffe 100%);
  border-left: 4px solid #e91e63;
}

.app-item.color-5 {
  background: linear-gradient(135deg, #f3e5f5 0%, #fffffe 100%);
  border-left: 4px solid #9c27b0;
}

.drag-handle {
  cursor: grab;
  padding: 8px;
  margin-right: 12px;
  color: #666;
  user-select: none;
  font-weight: bold;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.item-content {
  flex: 1;
}

.item-content h3 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.item-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}
</style>
