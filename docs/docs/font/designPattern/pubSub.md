# 发布订阅（观察者模式）

## 什么是发布订阅模式？

发布订阅模式（Publish-Subscribe Pattern）是一种设计模式，用于实现对象之间的松耦合通信。它通过一个事件中心（Event Bus）来管理发布者和订阅者之间的关系，发布者发布事件，订阅者监听事件，从而实现消息的分发。

## 单例模式的实现原理

1. 事件中心：一个中间对象，用于存储事件和对应的回调函数。
2. 订阅（Subscribe）：订阅者注册事件和回调函数。
3. 发布（Publish）：发布者触发事件，通知所有订阅者。
4. 取消订阅（Unsubscribe）：订阅者可以移除事件监听。

## 核心实现

```typescript
// EventBus.ts
type EventHandler = (...args: any[]) => void;

class EventBus {
  private static instance: EventBus;
  private events: Map<string, EventHandler[]>;

  private constructor() {
    this.events = new Map();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // 订阅事件
  public on(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(handler);
  }

  // 取消订阅
  public off(eventName: string, handler: EventHandler): void {
    const handlers = this.events.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // 发布事件
  public emit(eventName: string, ...args: any[]): void {
    const handlers = this.events.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
}

export default EventBus;
```

---

## 使用示例

### 无限递归 Vue 组件

以下是一个使用发布订阅模式实现的 Vue 无限递归组件示例，子孙组件通过发布事件通知，根组件通过订阅事件监听。

#### 根组件 (App.vue)

```vue
<script setup lang="ts">
import { provide } from 'vue';
import TreeNode from './components/TreeNode.vue';
import { onUnmounted } from 'vue';

const eventBus = new EventBus();
provide('eventBus', eventBus);

// 订阅节点点击事件
eventBus.on('nodeClick', (payload: { id: string; level: number }) => {
  console.log(`节点被点击：`, payload);
});

onUnmounted(() => {
  eventBus.off('nodeClick', clickHandler);
});
</script>

<template>
  <div class="app">
    <h1>组织架构树</h1>
    <TreeNode :id="'root'" :level="0" />
  </div>
</template>
```

#### 递归组件 (TreeNode.vue)

```vue
<script setup lang="ts">
import { inject } from 'vue';

const props = defineProps<{
  id: string;
  level: number;
}>();

const eventBus = inject('eventBus') as EventBus;

// 模拟子节点数据
const getChildNodes = () => {
  if (props.level >= 4) return []; // 限制递归深度
  return [
    { id: `${props.id}-1`, level: props.level + 1 },
    { id: `${props.id}-2`, level: props.level + 1 },
  ];
};

const handleClick = () => {
  // 发布点击事件
  eventBus.emit('nodeClick', {
    id: props.id,
    level: props.level,
  });
};
</script>

<template>
  <div class="node" @click.stop="handleClick">
    <div class="content">节点 {{ id }} (Level: {{ level }})</div>
    <div class="children">
      <TreeNode
        v-for="node in getChildNodes()"
        :key="node.id"
        :id="node.id"
        :level="node.level"
      />
    </div>
  </div>
</template>

<style scoped>
.node {
  padding: 10px;
  border: 1px solid #ddd;
  margin: 5px;
  cursor: pointer;
}
.children {
  margin-left: 20px;
}
</style>
```

## 优缺点

- 优点
  1. 松耦合：发布者和订阅者互不依赖
  2. 灵活性：可以动态添加或删除订阅关系
  3. 可扩展性：易于添加新的发布者和订阅者
- 缺点
  1. 内存泄漏：需要手动管理订阅关系
  2. 事件追踪困难：当系统变大时难以追踪事件流向
  3. 命名冲突：事件名可能重复

## 总结

发布订阅模式是一种强大的设计模式，特别适合处理组件间的通信。在 Vue 等前端框架中，它可以优雅地解决跨层级组件通信、模块解耦等问题。但使用时需要注意内存管理和事件追踪等问题。
