<template>
  <div class="container">
    <h1>📝 Vue 3.2 拖拽列表</h1>

    <div class="controls">
      <el-button type="primary" @click="addItem"> ➕ 添加项目 </el-button>
      <span class="count">共 {{ form.info_zh.length }} 项</span>
    </div>

    <ul
      class="drag-list"
      v-drag-list="{
        list: form.info_zh,
        dragList: form.info_zh,
        dragItemClass: 'item',
        dragHandleClass: 'drag',
      }"
      @drag-mode-end="handleDragEnd"
    >
      <li
        class="item"
        v-for="(item, index) in form.info_zh"
        :key="index"
        :data-id="index + 1"
      >
        <div class="drag">
          <svg
            class="drag-handle"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="7" cy="7" r="2" fill="#888" />
            <circle cx="7" cy="12" r="2" fill="#888" />
            <circle cx="7" cy="17" r="2" fill="#888" />
            <circle cx="17" cy="7" r="2" fill="#888" />
            <circle cx="17" cy="12" r="2" fill="#888" />
            <circle cx="17" cy="17" r="2" fill="#888" />
          </svg>
        </div>

        <div class="image">
          {{ index + 1 }}
        </div>

        <div class="text">
          <el-input
            v-model="form.info_zh[index].text"
            type="textarea"
            clearable
            placeholder="简介说明"
            :rows="3"
          />
          <div class="delete">
            <el-button
              round
              type="danger"
              size="small"
              plain
              @click="removeItem(index)"
            >
              移出该项
            </el-button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="form.info_zh.length === 0" class="empty-state">
      暂无数据，点击上方按钮添加项目
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { vDragList } from 'vue3-drag-directive';
import { ElInput, ElButton } from 'element-plus';

// 响应式数据
const form = reactive({
  info_zh: [
    { text: '这是第一个项目的简介说明，可以编辑修改内容。' },
    { text: '这是第二个项目的简介说明，支持多行文本输入。' },
    { text: '这是第三个项目的简介说明，可以通过拖拽调整顺序。' },
  ],
});

// 添加项目
const addItem = () => {
  form.info_zh.push({
    text: `新添加的项目 ${form.info_zh.length + 1}`,
  });
};

// 移除项目
const removeItem = (index) => {
  form.info_zh.splice(index, 1);
};

// 拖拽结束处理
const handleDragEnd = (event) => {
  console.log('拖拽结束:', event.detail);
  const { updatedData } = event.detail;

  // 更新数据
  if (updatedData && updatedData.length > 0) {
    form.info_zh.splice(0, form.info_zh.length, ...updatedData);
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.count {
  color: #666;
  font-size: 14px;
}

.drag-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  display: flex;
  align-items: flex-start;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  position: relative;
}

.item:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drag {
  font-size: 16px;
  color: #999;
  margin-right: 12px;
  cursor: grab;
  user-select: none;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
  min-width: 20px;
  text-align: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.drag:hover {
  background: #e0e0e0;
  color: #666;
}

.drag:active {
  cursor: grabbing;
}

.image {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  margin-right: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delete {
  align-self: flex-start;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}
</style>
