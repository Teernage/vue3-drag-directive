<template>
  <div class="demo-container">
    <div class="commodity">
      <div
        class="flex"
        v-drag-list="{
          list: loadProductData,
          canDrag: true,
          dragItemClass: 'product-card',
        }"
        @drag-mode-end="handleDragEnd"
      >
        <div
          class="product-card"
          v-for="item in loadProductData"
          :key="item.id"
          :data-id="item.id"
        >
          <div class="card-body">
            <div class="product-name">{{ item.name }}</div>
            <img
              style="width: 100px; height: 100px"
              :src="item.image"
              alt="商品图片"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { vDragList } from 'vue3-drag-directive'; // 通过npm包引入拖拽指令
// 模拟商品数据
const loadProductData = ref([
  {
    id: '1',
    name: '玫瑰花',
    image:
      'https://pic1.arkoo.com/56D0B40F99F841DF8A2425762AE2565D/picture/o_1i4qop009177v1tgf14db15he1iaj1is.jpg',
  },
  {
    id: '2',
    name: '百合花',
    image:
      'https://pic1.arkoo.com/56D0B40F99F841DF8A2425762AE2565D/picture/o_1i4qop009177v1tgf14db15he1iaj1is.jpg',
  },
  {
    id: '3',
    name: '郁金香',
    image:
      'https://pic1.arkoo.com/56D0B40F99F841DF8A2425762AE2565D/picture/o_1i4qop009177v1tgf14db15he1iaj1is.jpg',
  },
]);

const handleDragEnd = (event) => {
  const { updatedData, draggedItemData } = event.detail;
  console.log('拖拽结束', updatedData);
  console.log('被拖拽的项目', draggedItemData);
};
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.commodity {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.flex {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.product-card {
  width: 150px;
  height: 150px;
  margin: 0 auto;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: all 0.3s ease;
  overflow: hidden;
  user-select: none;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
  pointer-events: none;
  user-select: none;
}
</style>
