<template>
  <div class="demo-container">
    <div class="demo-component">
      <slot></slot>
    </div>
    <div v-if="showCode" class="demo-code">
      <div class="code-content">
        <slot name="code"></slot>
      </div>
    </div>
    <div class="demo-actions">
      <button class="code-button" @click="toggleCode">
        {{ showCode ? '隐藏示例代码' : '查看示例代码' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const showCode = ref(false);

const toggleCode = () => {
  showCode.value = !showCode.value;
};
</script>

<style scoped>
.demo-container {
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.demo-component {
  padding: 24px;
  background-color: var(--vp-c-bg-soft);
}

.demo-code {
  border-top: 1px solid var(--vp-c-divider);
  padding: 16px;
  background-color: var(--vp-code-block-bg);
  transition: all 0.3s;
}

.demo-actions {
  padding: 8px 16px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}

.code-button {
  border: 1px solid var(--vp-c-brand);
  color: var(--vp-c-brand);
  background-color: transparent;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.code-button:hover {
  color: white;
  background-color: var(--vp-c-brand);
}

.code-content {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
}
</style>
