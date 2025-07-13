# vue3 中的设计模式应用

## 1. 观察者模式(Observer Pattern)

Vue 3 的响应式系统中，reactive 、ref、 computed 的核心是 依赖收集 和 依赖触发，这正是观察者模式的体现：

- 主体：响应式对象（reactive 或 ref）。
- 观察者：依赖于响应式对象的副作用函数（watchEffect 或组件的渲染函数）。
- 通知机制：当响应式对象的值发生变化时，触发依赖的副作用函数重新执行。

```js
// Vue 3的响应式系统
import { reactive, watchEffect } from 'vue';

// 创建响应式状态
const state = reactive({ count: 0 });

// 观察者：当count变化时自动执行
watchEffect(() => {
  console.log('Count changed:', state.count);
});

// 修改状态触发观察者
state.count++; // 控制台输出: "Count changed: 1"
```

在这里：

- state 是主体。
- watchEffect 是观察者。
- 当 state.count 变化时，watchEffect 被通知并重新执行。

## 2. 代理模式 (Proxy Pattern)

Vue 3 使用 Proxy 来实现响应式对象（reactive 和 ref）。通过 Proxy，Vue 拦截了对对象属性的读取和写入操作，从而实现了依赖收集和触发更新。

```js
const target = { count: 0 };

const proxy = new Proxy(target, {
  get(target, key) {
    console.log(`Getting ${key}:`, target[key]);
    return target[key];
  },
  set(target, key, value) {
    console.log(`Setting ${key} to ${value}`);
    target[key] = value;
    return true;
  },
});

proxy.count; // 输出: Getting count: 0
proxy.count = 1; // 输出: Setting count to 1
```

在这里：

- proxy 是代理对象。
- get 和 set 拦截了对 target 的访问和修改。

Vue 3 的响应式系统实际上是 代理模式 和 观察者模式 的结合：

1. 代理模式：通过 Proxy 拦截对响应式对象的访问和修改。

- 在 get 拦截器中，Vue 会进行 依赖收集，将当前的观察者（副作用函数）与响应式对象的属性关联起来。
- 在 set 拦截器中，Vue 会进行 依赖触发，通知所有依赖于该属性的观察者重新执行。

2. 观察者模式：依赖收集和触发更新的机制本质上是观察者模式的实现。

<img src="/img/designPattern/观察者模式和代理模式对比.webp"  alt="观察者模式和代理模式对比"  />

- 观察者模式 是一种更高层次的设计模式，描述的是对象之间的关系（状态变化 -> 通知观察者）。
- 代理模式 是一种实现技术，描述的是如何拦截对象的操作（拦截访问 -> 添加逻辑）。

在 Vue 3 中，Proxy 是实现响应式系统的底层技术，而观察者模式是响应式系统的核心设计思想。两者结合在一起，使得 Vue 3 的响应式系统既高效又易用。（观察者模式是设计思想，代理模式是实现手段）

## 3. 策略模式 (Strategy Pattern)

Vue 中的指令系统和动画系统都体现了策略模式。

popup.vue

```js
// 不同的过渡策略
const transitions = {
  fade: { enter: '...', leave: '...' },
  slide: { enter: '...', leave: '...' },
  zoom: { enter: '...', leave: '...' }
}

function close(){
 // ....
}

// 根据需要选择不同的过渡策略
<Transition :name="transitionType">
  <dialog v-if="show" v-clickout='close'>Content</dialog>
</Transition>
```

vue 的指令系统和动画系统的逻辑是独立封装的，不会影响到如上的 dialog 组件本身的功能，只是扩张了组件的功能,变成了当前的 popup 组件，dialog 组件在其他地方使用功能还是不变，这种设计既增强了组件的灵活性，又保证了其独立性和可复用性

## 4. 单例模式（Singleton Pattern）

- 描述：单例模式确保一个类只有一个实例，并提供一个全局访问点。
- 在 Vue 3 中的应用：
  - Vuex（或 Pinia）中的 Store 是单例模式的典型应用，整个应用中只有一个全局的状态管理实例。

```js
import { createPinia } from 'pinia';

const pinia = createPinia(); // 单例模式
app.use(pinia);
```

## 5. 工厂模式 (Factory Pattern)

定义：工厂模式提供一个创建对象的接口，允许子类决定实例化的对象类型。

Vue 3 中的应用：

创建渲染器 - createRenderer

```js
// packages/runtime-core/src/renderer.ts
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>) {
  return baseCreateRenderer < HostNode, HostElement > options;
}

function baseCreateRenderer(options: any) {
  // 实现渲染逻辑...
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate),
  };
}
```

分析：createRenderer 是典型的工厂函数，它接收平台特定的渲染选项（DOM、Canvas 等），并返回适合该平台的渲染器实例。使 Vue 能够在不同不同环境上运行，而不修改核心代码。

除此之外还有

- createApp()：创建 Vue 应用实例
- h()/createVNode()：创建虚拟节点

## 6. 适配器模式

Vue3 通过自定义渲染器 API(createRenderer)完全分离了渲染逻辑和平台特定代码：

```js
// 创建渲染器的核心函数
export function createRenderer(options) {
  return baseCreateRenderer(options);
}

// 用法示例
const { render } = createRenderer({
  createElement,
  setElementText,
  patchProp,
  insert,
  remove,
  // ...更多平台特定操作
});
```

适配器实现方式

1. DOM 渲染器适配器:

```js
// DOM平台的适配实现
const rendererOptions = {
  patchProp,
  forcePatchProp,
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) parent.removeChild(child);
  },
  createElement: (tag, isSVG, is) =>
    isSVG
      ? document.createElementNS(svgNS, tag)
      : document.createElement(tag, is ? { is } : undefined),
  // ...其他DOM操作
};
```

2. Canvas 渲染器适配器:

```js
// Canvas平台的适配实现示例
const canvasRendererOptions = {
  patchProp: (el, key, prevValue, nextValue) => {
    // Canvas特有属性处理逻辑
  },
  insert: (child, parent, anchor) => {
    // Canvas中的元素插入逻辑
    parent.addChild(child, anchor);
  },
  createElement: (type) => {
    // 创建Canvas图形元素
    return new CanvasElement(type);
  },
  // ...其他Canvas操作
};
```

通过这种适配器模式的设计，Vue3 成功将自身从特定平台限制中解放出来，成为真正的跨平台框架，使得同一套 Vue 组件代码可以在不同环境中渲染，无论是浏览器 DOM、Canvas 画布。

createRenderer 同时体现了工厂模式和适配器模式

- 工厂职责：创建和返回渲染器实例
- 适配器职责：将平台特定操作适配到 Vue 内部渲染系统

## 7. 命令模式

#### vue3 响应式系统中的命令模式

在 Vue3 的响应式系统中，当数据变化时，不会直接更新 DOM，而是创建一系列“更新命令”，这些命令被放入队列中，然后批量执行：

```js
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

function flushJobs() {
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    job(); // 执行命令
  }
  queue.length = 0;
}
```

命令模式体现：

- 每个 job 是一个命令对象，封装了“更新 DOM”的操作。
- 通过队列统一管理这些命令，避免重复执行并优化性能。

#### 编译器中的命令模式

Vue3 的模板编译过程分为三个主要阶段：解析（parse）、转换（transform）和生成（generate）。其中转换阶段使用了插件化的设计，每个转换插件都可以看作是一个命令。

转换插件机制：

```js
function baseCompile(template, options = {}) {
  const ast = parse(template, options);

  transform(ast, {
    ...options,
    nodeTransforms: [
      transformElement,
      transformText,
      transformOnce,
      transformIf,
      transformFor,
      ...(options.nodeTransforms || []),
    ],
  });

  return generate(ast, options);
}
```

命令模式体现：

- 每个 transform 函数（如 transformElement, transformText, transformIf）都是一个命令，封装了特定的 AST 转换逻辑。
- 这些命令被统一管理并按顺序执行，增强了扩展性和灵活性。

#### 转换阶段的命令队列

转换阶段通过深度优先遍历 AST，并收集退出命令，最终以相反顺序执行这些命令：

```js
function traverseNode(node, context) {
  const exitFns = [];
  const transforms = context.nodeTransforms;

  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i];
    const onExit = transform(node, context);
    if (onExit) {
      exitFns.push(onExit); // 收集退出命令
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context);
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i](); // 以相反顺序执行退出命令
  }
}

function traverseChildren(parent, context) {
  for (let i = 0; i < parent.children.length; i++) {
    traverseNode(parent.children[i], context);
  }
}
```

执行顺序解析：

- 先进入节点：应用所有转换函数，收集退出函数。
- 递归处理子节点：对每个子节点重复这个过程。
- 后执行退出函数：当所有子节点处理完毕后，以相反顺序执行当前节点的退出函数。

##### 总结

命令模式的优势：

- 解耦调用者与执行者。
- 支持命令的独立测试、复用和扩展。
- 通过队列或插件机制统一管理命令，增强灵活性。

Vue3 中的体现：

- 响应式系统：通过队列管理更新命令，优化性能。
- 编译器转换：通过插件机制封装 AST 转换逻辑，增强扩展性。

## 8.装饰器模式（Decorator Pattern）

定义：动态地给对象添加额外的职责，是扩展功能的灵活替代方案。

- 指令系统

```js
// 简化版的指令实现
const directives = {
  model: {
    // 为元素添加双向绑定功能
    mounted(el, binding, vnode) {
      el.value = binding.value;
      el.addEventListener('input', () => {
        vnode.component.props[binding.arg || 'modelValue'] = el.value;
      });
    },
    updated(el, binding) {
      el.value = binding.value;
    },
  },
  focus: {
    // 为元素添加自动聚焦功能
    mounted(el) {
      el.focus();
    },
  },
};

// 指令应用的过程
function mountElement(vnode, container) {
  const el = document.createElement(vnode.type);

  // 处理指令（装饰器）
  if (vnode.dirs) {
    for (const [name, binding] of Object.entries(vnode.dirs)) {
      const directive = directives[name];
      directive.mounted(el, binding, vnode);
    }
  }

  // ... 其他挂载逻辑
}
```

在上述例子中，指令就像装饰器一样为 DOM 元素添加了额外的行为，而不需要修改元素本身的定义。

## 9.中介者模式（Mediator Pattern）

provide 和 inject 通过一个中介者（上下文 instance）来实现父子组件之间的解耦通信。

- 特点:

1. 松散耦合：子组件不需要知道数据来自哪个父组件，父组件也不需要知道哪些子组件会使用它提供的数据。
2. 集中通信：数据流通过 Vue 的组件上下文这个"中介"传递，而不是组件之间直接通信。
3. 隐式依赖：子组件只依赖于特定的 key，而不是特定的组件实例。

```js
// 简化版provide/inject实现
let currentInstance = null

function setCurrentInstance(instance) {
  currentInstance = instance
}

// 在父组件中提供数据
function provide(key, value) {
  if (!currentInstance) return

  // 中介对象：当前组件实例的provides
  let provides = currentInstance.provides

  // 存储提供的数据
  provides[key] = value
}

// 在子组件中注入数据
function inject(key, defaultValue) {
  if (!currentInstance) return defaultValue

  // 获取当前组件的父级provides作为中介
  const provides = resolveProvides(currentInstance,key)

  if (key in provides) {
    return provides[key]
  } else if (defaultValue !== undefined) {
    return defaultValue
  }
}

// 沿着组件层次向上查找provides对象
function resolveProvides(instance, key) {
  let parent = instance.parent
  // 现在正确地使用传入的key参数
  while (parent && !(key in parent.provides)) {
    parent = parent.parent
  }
  return parent?.provides || {}
}

// 使用示例
// ParentComponent.vue
{
  setup() {
    provide('theme', 'dark')  // 将数据交给"中介"
  }
}

// 任意深度的子组件
{
  setup() {
    const theme = inject('theme')  // 从"中介"获取数据
  }
}
```

#### 总结

provide/inject 确实体现了中介者模式的核心思想，虽然它是一种变体实现：

1. 使组件之间不需要直接引用就能通信
2. 减少了组件之间的耦合
3. 通过一个隐式的中介（组件上下文）传递数据

## 10.访问者模式（Visitor Pattern）

访问者模式允许我们在不改变对象结构的情况下，定义新的操作或行为。

在 Vue3 中的应用：

Vue3 的 模板编译器 使用了访问者模式来遍历和操作抽象语法树（AST）。在编译阶段，Vue3 会对模板进行解析，生成 AST，然后通过访问者模式对 AST 节点进行处理。

示例：

```js
function traverseNode(node, context) {
  context.currentNode = node;
  const transforms = context.nodeTransforms;
  for (let i = 0; i < transforms.length; i++) {
    transforms[i](node, context);
  }
}
```

源码分析：

- 在 @vue/compiler-core 中，traverseNode 函数会遍历 AST 节点，并调用注册的转换函数（nodeTransforms）。
- 每个转换函数可以对节点进行操作，例如优化、代码生成等。
- 这种设计允许开发者通过插件或扩展轻松添加新的行为，而无需修改 AST 的结构。

## 11.外观模式（Facade Pattern）

外观模式提供了一个统一的接口，用来访问子系统中的一群接口，简化复杂系统的调用过程。

Vue3 中的应用：

- Composition API：Vue3 通过 createApp、ref、reactive、computed 等 API 提供了简单易用的接口，隐藏了内部实现的复杂性
- 渲染函数：h 函数提供了一个简单的接口来创建虚拟 DOM，屏蔽了底层渲染实现细节

```js
// 外观模式示例 - createApp函数
export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args);

  const { mount } = app;
  // 重写mount方法，提供统一的接口
  app.mount = (containerOrSelector) => {
    // 内部处理复杂逻辑...
    return mount(container);
  };

  return app;
};
```

## 12.责任链模式（Chain of Responsibility Pattern）

vue3 组件生命周期钩子链

Vue3 组件在初始化、更新和销毁过程中会按顺序调用一系列生命周期钩子，形成一条完整的责任链：

```js
// packages/runtime-core/src/renderer.ts (简化版)
const mountComponent = (initialVNode, container) => {
  // 创建组件实例
  const instance = createComponentInstance(initialVNode);

  // 责任链开始
  setupComponent(instance); // 首先设置组件
  setupRenderEffect(instance); // 然后设置渲染效果

  // 生命周期钩子责任链
  if (instance.beforeCreate) callHook(instance, 'beforeCreate');
  // 处理setup
  if (instance.created) callHook(instance, 'created');

  // 挂载阶段
  if (instance.beforeMount) callHook(instance, 'beforeMount');
  // 执行挂载操作
  if (instance.mounted) callHook(instance, 'mounted');

  // 更新阶段也类似形成责任链
};

// 钩子调用函数
function callHook(instance, hook) {
  const { vnode } = instance;
  const handlers = vnode.props && vnode.props[hook];
  if (handlers) {
    if (Array.isArray(handlers)) {
      handlers.forEach((handler) => handler()); // 多个处理器依次执行
    } else {
      handlers();
    }
  }
}
```
