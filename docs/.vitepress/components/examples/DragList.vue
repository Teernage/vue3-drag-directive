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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

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

.app-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

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

@media (max-width: 768px) {
  .grid-container {
    gap: 3px;
    max-width: 350px;
    aspect-ratio: 0;
    height: auto;
  }

  .grid-container .app-item {
    font-size: 14px;
    height: 50px;
    width: 50px;
  }

  .container {
    padding: 20px; /* 移动端内边距调整 */
    margin: 10px;
  }
}
</style>
