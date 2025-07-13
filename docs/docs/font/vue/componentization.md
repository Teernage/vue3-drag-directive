# 组件化

<img src="/img/vue/组件的实现原理.webp" alt="组件的实现原理"  />

### 组件渲染与响应式更新机制解析

组件对象要渲染的内容在 render 方法里，render 方法返回虚拟 dom 给 renderer 渲染器进行渲染

#### 执行组件对象的 data 方法需要做什么操作？

- 执行 data 方法：调用组件对象的 data 方法，获取返回值。
- 响应式包装：使用 reactive 包裹 data 方法的返回值，使其成为响应式数据。
- 绑定 this 指向：在执行组件对象的 render 方法时，将 this 指向 reactive 包裹的 - - data 数据对象，以便在 render 方法中通过 this 访问响应式数据。

#### 组件是如何实现自身响应式更新的？如何避免频繁更新组件？

- 通过 render 函数渲染：组件的渲染逻辑在 render 函数中实现。
- 依赖 effect 副作用函数：将调用 render 函数的逻辑包裹在 effect 副作用函数中。
- 当 effect 执行时，读取响应式数据会触发依赖收集。
- 当响应式数据发生变化时，依赖的 effect 会被重新执行，从而触发组件更新。

```js
function mountComponent(vnode, container, anchor) {
  const componentOptions = vnode.type;
  const { render, data } = componentOptions;
  const state = reactive(data());

  /**  instance.update是effect函数的返回值，其实就是副作用回调() => {
      const subTree = render.call(state, state)
       patch(null, subTree, container, anchor)
     } */
  instance.update = effect(
    () => {
      const subTree = render.call(state, state);
      patch(null, subTree, container, anchor);
    },
    {
      // 指定该副作用函数的调度器为 queueJob 即可
      scheduler: queueJobs(instance.update),
    }
  );
}
```

当响应式变量发生了变化，不会再立即执行 effect 中的内容，而是直接执行 scheduler 调度器函数,这个调度器函数是 queueJob，如果当前宏任务中变量更新了 n 次，那么当前的 effect 回调会被添加到 set 集合 n 次，又因为集合有去重能力，所以只有一次，如下代码 queueFlush 方法只有在当前栈没清空前只会执行一遍(即当前宏任务执行完成前)，等到栈清空了，当前宏任务结束之前需要清空微任务队列，此时执行 p.then 的内容执行 set 集合模拟的这个队列中收集的 effect 回调，这样就解决了多次更新响应式变量频繁触发组件更新的问题

```js
// 任务缓存队列，用一个 Set 数据结构来表示，这样就可以自动对任务进行去重
const queue = new Set();
// 一个标志，代表是否正在刷新任务队列
let isFlushing = false;
// 创建一个立即 resolve 的 Promise 实例
const p = Promise.resolve();

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  // 建立微任务 等到当前宏任务执行完毕之前执行
  nextTick(flushJob);
}

/**
 * nextTick 在当前宏任务结束之前执行，视图更新也是微任务也是在当前宏任务之前执行，所以在nextTick的fn回调中可以
 * 获取到最新的组件实例
 * @param fn 回调
 */
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}
```

本质上利用了微任务的异步执行机制，实现对副作用函数的缓冲。其中 queueJob 函数是调度器最主要的函数，用来将一个任务或副作用函数添加到缓冲队列中，并开始刷新队列。有了 queueJob 函数之后，我们可以在创建渲染副作用时使用它，当响应式数据发生变化时，副作用函数不会立即同步执行，而是会被 queueJob 函数调度，最后在一个微任务中执行

```vue
<template>
  <div>{{ count }}</div>
</template>
<script setup>
const count = ref(0);
for (let i = 0; i < 100; i++) {
  count.value++;
}
</script>
```

如上例子不会频繁更新，因为每次更新都会将 effect 副作用函数添加到微任务队列中，等到当前宏任务执行完成前才会清空微任务队列，这样就不会频繁触发组件更新

### nextTick 原理

上面代码中出现 nextTick 函数，nextTick 是 vue3 中提供的一个工具方法，用于将回调延迟到下一个 DOM 更新周期之后执行。它的实现原理是利用了浏览器的事件循环机制，我们来详细了解一下 nextTick 的实现原理

在 vue 中，当我们需要操作 dom 时，那就需要在 dom 挂载之后才能去操作，通常我们只要使用 nextTick，在 nextTick 的回调中必定可以拿到挂载后的 dom，vue 内部是如何做的呢？

要了解这个原理必须要了解 js 中的宏任务和微任务的概念

举例：

```js
<script>
function a(){
   console.log('我是函数a，我来了')
}

function b(){
   console.log('我是函数b，我来了')
}

function c(){
   console.log('我是函数c，我来了')
}

setTimeout(() => {
   b()
})

Promise.resolve().then(() => {
    c()
});

a()
</script>

// 执行结果：
我是函数a，我来了
我是函数c，我来了
我是函数b，我来了

```

#### 为什么 b 最后执行？

这是因为 setTimeout 是一个宏任务（Macro Task）。当代码执行到 setTimeout 时，它会将任务添加到宏任务队列中，等到当前执行栈中的所有同步代码执行完毕后，才会从宏任务队列中取出任务执行。因此，b 的执行被延后到最后。

#### 为什么 a 先执行，而 c 后执行？

- a 是普通的同步代码，直接在当前执行栈中执行，因此最先输出“我是函数 a，我来了”。
- `Promise.resolve().then(() => { c(); })`是一个微任务（Micro Task）。微任务的执行时机是在当前宏任务（即整个`<script></>`代码块）执行完毕后、进入下一个宏任务之前。所以，c 的执行紧接着同步代码完成后进行。

注:每次创建一个宏任务的时候都会创建一个微任务队列，在执行完一个宏任务前会清空当前宏任务内的微任务队列

当代码执行到第 23 行时，js 事件循环机制如下图所示

<img src="/img/vue/事件循环机制1.webp" alt="事件循环机制1"  />

a()函数执行完毕之后出栈，取出当前宏任务的微任务压栈进行执行

<img src="/img/vue/事件循环机制2.webp" alt="事件循环机制2"  />

等到微任务都清空之后，当前栈为空，所以此时 v8 会将宏任务队列中的任务取出来进行压栈处理

<img src="/img/vue/事件循环机制3.webp" alt="事件循环机制3"  />

等到微任务都清空之后，当前栈为空，所以此时 v8 会将宏任务队列中的任务取出来进行压栈处理

<img src="/img/vue/事件循环机制4.webp" alt="事件循环机制4"  />

最后完成 b 函数的调用

好了，了解了上述的事件循环机制的宏任务和微任务的概念之后，我们继续了解 nextTick 的一个实现，在 vue 中，使用 nextTick 的原理非常的简洁

```js
const p = Promise.resolve();
export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
}
```

看了上面的例子之后看这个觉得非常简单，因为本质就是一个微任务。

#### 那这样我们在 vue 的 代码中直接使用 promise.then 来实现我们要获取 dom 的需求不就好了吗？为什么还需要使用 vue 内部提供的 nextTick 呢？

虽然直接使用 promise.then 和 nextTick 本质都是微任务，但是我们上面的例子讲解了微任务的执行时机是在当前宏任务执行结束之前执行，那么你直接在 promise.then 回调中和 nextTick 回调中执行所处的宏任务是不一样的。所以最终执行的效果会不一样，nextTick 中的回调能准确获取到已挂载，但是 promise.then 则不一定

为了更详细的了解 nextTick 回调中为什么能准确获取到已挂载的 dom，我们来看看 vue 中是如何实现的

以下是 vue 组件更新机制的核心实现

```js
  function setupRenderEffect(instance, initialVNode, container) {

    function componentUpdateFn() {
      ....
    }

    instance.update = new ReactiveEffect(componentUpdateFn, {
      scheduler: () => {
        // 把 effect 推到微任务的时候在执行
        // queueJob(effect);
        queueJob(instance.update);
      },
    });
  }
```

```js
const queue: any[] = [];
const p = Promise.resolve();

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    // 执行所有的 job
    queueFlush();
  }
}

function queueFlush() {
  nextTick(flushJobs);
}

export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
}
```

setupRenderEffect 函数的作用：

- 为每个组件创建一个渲染 effect
- 当组件需要更新时，不会立即执行更新，而是通过 scheduler 调度器将更新任务（instance.update）推入队列

queueJob 函数的职责：

- 接收一个更新任务（job）
- 确保同一个任务不会重复入队（去重处理）
- 将任务推入队列后，调用 queueFlush 来安排任务的执行

当组件中的响应式变量发生变化之后，会触发 scheduler 调度器，scheduler 调度器会调用 queueJob 方法，会将当前更新任务添加进队列中，等待当前宏任务执行完毕之前执行，当前宏任务就是组件更新之后触发的重新渲染，所以在这个宏任务之后去执行 nextTick 的回调，就能准确拿到 dom 节点了

### Vue 组件更新的两种触发方式

#### 1. 响应式触发更新

当组件内的响应式数据发生变化时，通过依赖收集和 effect 机制，触发 scheduler 执行，将更新任务放入微任务队列：

```js
instance.update = new ReactiveEffect(componentUpdateFn, {
  scheduler: () => {
    // 把 effect 推到微任务的时候在执行
    queueJob(instance.update);
  },
});
```

上面提到 vue 组件更新时会执行 scheduler 调度器调用 queueJob 方法

#### 2.主动触发更新

当父组件更新导致子组件需要更新时(如 props 变化)，通过 updateComponent 直接调用 instance.update()触发更新：

```js
function updateComponent(n1, n2, container) {
  console.log('更新组件', n1, n2);
  // 更新组件实例引用
  const instance = (n2.component = n1.component);
  // 先看看这个组件是否应该更新
  if (shouldUpdateComponent(n1, n2)) {
    console.log(`组件需要更新: ${instance}`);
    instance.next = n2;
    instance.update();
  } else {
    console.log(`组件不需要更新: ${instance}`);
    // 不需要更新的话，那么只需要覆盖下面的属性即可
    n2.component = n1.component;
    n2.el = n1.el;
    instance.vnode = n2;
  }
}
```

如上代码，instance.update()触发执行的是 effect 方法的返回值，effect 方法内部返回了 componentUpdateFn，所以，需要更新的是 componentUpdateFn 方法

##### 小结：

在 updateComponent 中主动调用 instance.update() 是为了处理父组件更新引起的子组件更新。这种更新不是由响应式变量的变化触发的，因此需要显式地调用更新逻辑。而响应式变量的变化触发更新的机制是通过依赖收集和 effect 实现的，这两者是独立的更新路径。
如果只依赖响应式变量的变化来触发更新，那么无法覆盖 props 或 slots 变化的场景，因此需要在 updateComponent 中主动调用 instance.update()。

### 组件的生命周期

beforeCreate ->将 data 变成响应式数据

1. 新建组件实例 instance -> created -> 进入 2 或 3
2. 如果是首次挂载 -> beforeMount -> 挂载节点 -> mounted
3. 如果不是首次挂载 -> beforeUpdate -> 更新节点 -> updated

#### 组件对象是如何存储在 vnode 中的？

组件对象存储在 vnode.type 中，组件实例 instance 存储在 vnode.component，这里 vnode 的 props 属性是父组件传递的

```js
const vnode = {
  type: MyComponent,
  props: {
    title: 'A big Title',
    other: this.val,
  },
  components: instance,
};
```

MyComponent.props 是接收父组件传递的 props

```js
const MyComponent = {
  name: 'MyComponent',
  // 组件接收名为 title 的 props，并且该 props 的类型为 String
  props: {
    title: String,
  },
  render() {
    return {
      type: 'div',
      children: `count is: ${this.title}`, // 访问 props 数据
    };
  },
};
```

#### 组件实例 instance

组件实例 instance 里存储着当前组件所需要的信息，包括当前组件是否已经挂载过等

```js
// 创建组件实例对象
const instance = {
  // 组件的状态数据
  state,

  // 对组件的 props 进行浅层响应式处理
  // shallowReactive 只会对对象的第一层属性进行响应式转换
  // 与 reactive 的区别是不会递归地深层转换
  props: shallowReactive(props),

  // 标记组件是否已经挂载到 DOM 树上
  // 初始化时设置为 false，组件挂载后会设置为 true
  isMounted: false,

  // 组件的渲染树
  // 用于存储组件渲染的虚拟 DOM 树
  // 初始为 null，组件渲染后会被赋值
  subTree: null,
};

// 将组件实例挂载到虚拟节点上
// 建立虚拟节点和组件实例之间的关联
// 这样可以通过 vnode 访问到对应的组件实例
vnode.component = instance;
```

如果当前组件没有挂载过，那么直接 patch，如果有挂载过，那么拿 instance.subTree 和当前的 subTree 进行 patch 比较再更新

```js
// effect 函数，用于处理组件的渲染效果
effect(
  () => {
    // 调用组件的渲染函数，获得子树
    // 这里调用 render 函数，传入 state 作为参数，获取最新的虚拟 DOM 树
    const subTree = render.call(state, state);

    // 检查组件是否已经被挂载
    if (!instance.isMounted) {
      // 初次挂载时，调用 patch 函数，第一个参数传递 null
      // 因为是首次渲染，没有之前的树可以比较
      patch(null, subTree, container, anchor);

      // 重要：将组件实例的 isMounted 设置为 true
      // 这样当更新发生时就不会再次进行挂载操作，而是执行更新逻辑
      instance.isMounted = true;
    } else {
      // 当 isMounted 为 true 时，说明组件已经被挂载
      // 这时需要进行更新操作
      // 调用 patch 函数，第一个参数为组件上一次渲染的子树
      // 用新的子树和上一次渲染的子树进行比较，执行必要的 DOM 更新
      patch(instance.subTree, subTree, container, anchor);
    }

    // 更新组件实例的子树
    // 保存最新的渲染结果，用于下次更新时的比较
    instance.subTree = subTree;

    // 配置调度器选项，使用 queueJob 进行任务调度
  },
  { scheduler: queueJob }
);
```

#### 组件属性

组件对象的 props 转换成虚拟 dom 之后也是 vnode 对象的 props 属性，跟 HTML 标签的属性或 dom 的 property 属性一样，转换成 vnode 之后都会被存储到 vnode 的 props 属性中

```js
// 1. 定义组件
const MyComponent = {
  props: ['title', 'content'],
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>{{ content }}</p>
    </div>
  `
}

// 2. 使用组件
<MyComponent
  title="Hello Vue"
  content="This is a demo"
  class="my-component"
  @click="handleClick"
/>

// 3. 转换后的虚拟 DOM
const vnode = {
  type: MyComponent,
  props: {
    title: 'Hello Vue',          // 普通属性
    content: 'This is a demo',   // 普通属性
    class: 'my-component',       // DOM 属性
    onClick: handleClick         // 事件监听器
  }
}
```

#### props 和 attr 的区别？

父组件有传递的属性，子组件有接收，那么就是 props，
父组件有传递的属性，子组件没有接收，那么就是额外的属性 attr

假设我们有一个名为 "HelloWorld" 的组件，它接受一个名为 "message" 的 prop，并且我们在父组件中使用这个 "HelloWorld" 组件，并向其传递了一个名为 "color" 的属性。让我们看看这是如何在代码中体现的。

```js
const HelloWorld = {
  props: {
    message: String,
  },
  render() {
    return h('div', { class: 'hello' }, this.message);
  },
};
```

在这里，HelloWorld 组件的选项对象 componentOptions 就是包含了组件的各种定义，包括 render 函数、props 选项等。

现在，假设我们在父组件中使用了 "HelloWorld" 组件，并向其传递了一个名为 "color" 的属性：

```js
<template>
  <HelloWorld message="Hello, Vue!" color="red" />
</template>
```

在这个例子中，propsOption 就是指代了组件的 props 定义，即：

```js
{
  message: String;
}
```

而 vnode.props 就是指代了实际传递给组件的 props 数据，即：

```js
{
  message: "Hello, Vue!",
  color: "red"
}
```

在这个例子中，"message" 是组件自身定义的 prop，而 "color" 是额外的属性，它不在组件的 props 定义中。当 Vue.js 处理这个组件时，它会将 "message" 视为组件的 prop，而 "color" 则会被视为组件的 attrs 数据。

#### vue3 源码是如何判断 props 和 attr 的？

```js
function resolveProps(options, propsData) {
  const props = {};
  const attrs = {};
  // 遍历为组件传递的 props 数据
  for (const key in propsData) {
    if (key in options) {
      // 如果为组件传递的 props 数据在组件自身的 props 选项中有定义，则将其视为合法的 props
      props[key] = propsData[key];
    } else {
      // 否则将其作为 attrs
      attrs[key] = propsData[key];
    }
  }

  // 最后返回 props 与 attrs 数据
  return [props, attrs];
}
```

其实就是遍历父组件传递的 propsData，看看哪些属性存在于当前这个子组件对象的 props 对象中，如果存在的那就是当前这个子组件的 props 属性，不存在就是当前这个子组件的 attr 属性。

有一种情况除外，就是传递的是方法，即子组件 emit 发射的方法，这个即使子组件没有声明也会默认传递

#### 组件读取数据先读取自身的 data 还是父组件传递的 props？

每当在渲染函数或生命周期钩子中通过 this 来读取数据时，都会优先从组件的自身状态中读取，如果组件本身并没有对应的数据，则再从父组件传递的 props 数据中读取。最后我们将渲染上下文作为渲染函数以及生命周期钩子的 this 值即可。

#### 组件对象的 setup 函数的作用与实现

在组件的整个生命周期中，setup 函数只会在组件被挂载的时候执行一遍

setup 函数的返回值有两种情况

1. 返回一个函数，该函数作为组件的 render 函数

```js
const Comp = {
  setup() {
    // setup函数可以返回一个函数，该函数作为组件的渲染函数
    return () => {
      return { type: 'div', children: 'hello' };
    };
  },
};
```

这种方式常用于不是以 template 模版来表述其渲染内容的情况。

如果 setup 方法返回值是函数，那么这个函数就作为组件对象的 render 方法，覆盖原来组件对象编写的 render 方法，render 函数的优先级大于 template 模版

2. 返回一个对象，该对象中包含的数据将暴露给 template 模版使用

```js
const Comp = {
  setup() {
    const count = ref(0);
    // 返回一个对象，对象中的数据会暴露到渲染函数中
    return {
      count,
    };
  },
  render() {
    // 通过this可以访问setup暴露出来的响应式数据
    return { type: 'div', children: `count is : ${count}` };
  },
};
```

### 组件事件与 emit 的实现

发射自定义事件的本质是根据事件名称去父组件传递的 props 数据对象中寻找对应的事件处理函数并执行

如下例子：

parent 组件

```js
<template>
    <MyComponent @change='handle' />
</template>
```

parent 组件对应的 vnode

```js
const ComVnode = {
  type: MyComponent,
  props: {
    onChange: handler,
  },
};
```

MyComponent 组件

```js
const MyComponent = {
  name: 'MyComponent',
  setup(props, { emit }) {
    // 发射change事件，并传递给事件处理函数两个参数
    emit('change', 1, 2);
    return () => {
      return; // ...
    };
  },
};
```

以下是组件挂载的代码，执行组件的 setup 方法的时候把 emit 方法传递进去，所以我们平时在 setup 中开发使用到的 emit 就是传递进来的 emit 方法，看以下的 emit 方法，emit 方法会去当前组件实例的 props 中找 emit 发射事件名，如果有则执行对应的 props 属性值即回调，这就是 emit 的实现原理

```js
function mountComponent(vnode, container, anchor) {
  // 省略部分代码
  const componentOption = vnode.type;
  let { render, data, setup } = componentOptions;
  const instance = {
    state,
    props: shallowReactive(props),
    isMounted: false,
    subTree: null,
  };
  // 定义 emit 函数，它接收两个参数
  // event: 事件名称
  // payload: 传递给事件处理函数的参数
  function emit(event, ...payload) {
    // 根据约定对事件名称进行处理，例如 change --> onChange
    const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
    // 根据处理后的事件名称去 props 中寻找对应的事件处理函数
    const handler = instance.props[eventName];
    if (handler) {
      // 调用事件处理函数并传递参数
      handler(...payload);
    } else {
      console.error('事件不存在');
    }
  }

  // 将 emit 函数添加到 setupContext 中，用户可以通过 setupContext 取得 emit 函数
  const setupContext = { attrs, emit };
  // 省略部分代码
  const setupResult = setup(shallowReadonly(instance.props), setupContext);
}
```

这里的父组件传递的 props 方法给子组件，即使子组件没有声明 props 来接收，也会默认传递给子组件的 props，而不是 attr 属性

总结： 通过 v-on 指令或者@方法名来为组件绑定事件的情况，在经过编译后，会以 onXxx 的形式存储到 props 对象中。当 emit 函数执行时，会在 props 对象中寻找对应的事件处理函数并执行它

### 组件插槽的工作原理与实现

例如：

template 模版

MyComponent 组件里注入三个插槽内容 分别是 header、body、footer

```vue
<MyComponent>
    <template #header>
        <h1>我是标题</h1>
    </template>
     <template #body>
        <h1>我是内容</h1>
    </template>
     <template #footer>
        <h1>我是注脚</h1>
    </template>
</MyComponent>
```

编译成渲染函数之后如下：

```js
function render(){
    return {
        type: MyComponent,
        // 组件的children 会被编译成一个对象
        children:{
            header(){
                return {type:'h1',children:'我是标题'}
            },
            body(){
                return {type:'section',children:'我是内容'}
            },
            fotter(){
                return {type:'h1',children:'我是注脚'}
            },
        }，
        component:instance
    }
}
```

vnode 的 type 属性值是组件对象，children 属性值是组件的插槽内容

#### 子组件为什么能通过 this.$slot 来获取插槽内容？

```vue
<header>
  <slot name="header" />
</header>
```

子组件通过这种语法设置插槽。

之所以子组件的 render 方法里可以通过 this.$slots 可以访问 vnode.children 插槽内容，是因为在挂载组件方法 mountComponent 里，vnode 是描述使用子组件的虚拟节点，vnode.type 属性值是个组件对象，是子组件的信息。

vnode.type 对象包括这几个属性：render, data, setup, props 和生命周期函数。这里的 render 是 header 子组件的渲染函数。

在 mountComponent 方法里，slots 初始化为 vnode.children，副作用函数有这么一行代码：render.call(renderContext, renderContext)，意味着 render 函数内可以通过 this 来访问 renderContext 对象，而 slots 属性正好在 renderContext 对象里，并且源码对 renderContext 的 getter 做了拦截：如果访问的是 $slots，返回 slots，而 slots 就是 vnode.children，即父组件传递的插槽内容

以下是源码实现，调用 render 方法的时候改变 this 指向为 renderContext 上下文对象，而 renderContext 是一个 proxy 对象，所以在 render 方法内通过 this 访问属性会被 proxy 对象 renderContext 所拦截，然后访问 slots 对象的属性，而 slots 是 vnode 对象的 children 属性值，即父组件传递的插槽内容，这样就实现了 render 函数内部可以通过 this.$slot 来访问插槽内容

```js
function mountComponent(vnode, container, anchor) {
  // 创建组件实例需要的状态和属性
  const state = reactive({});
  const props = vnode.props || {};

  // 解析插槽内容
  const slots = vnode.children || {};

  const instance = {
    state,
    props: shallowReactive(props),
    isMounted: false,
    subTree: null,
    // 将插槽添加到组件实例上
    slots,
    // 添加渲染方法
    render: vnode.type.render,
  };

  // 创建渲染上下文代理
  const renderContext = new Proxy(instance, {
    get(t, k, r) {
      const { state, props, slots } = t;

      // 当 k 的值为 $slots 时，直接返回组件实例上的 slots
      if (k === '$slots') return slots;

      // 处理响应式状态、props 等访问逻辑
      if (state.hasOwnProperty(k)) return state[k];
      if (props.hasOwnProperty(k)) return props[k];
    },
    set(t, k, v, r) {
      // 设置响应式状态
      if (t.state.hasOwnProperty(k)) {
        t.state[k] = v;
        return true;
      }
      return false;
    },
  });

  // 执行渲染方法
  function setupRenderEffect() {
    // 首次挂载
    if (!instance.isMounted) {
      // 调用渲染方法，传入 props 和渲染上下文
      const subTree = instance.render.call(
        renderContext, // this 指向代理对象
        renderContext, // 传入 props
        {
          slots: instance.slots, // 传入插槽信息
        }
      );

      // 挂载子树
      patch(null, subTree, container, anchor);

      // 标记已挂载
      instance.isMounted = true;
      instance.subTree = subTree;
    } else {
      // 更新逻辑（省略）
      const newSubTree = instance.render.call(renderContext, renderContext, {
        slots: instance.slots,
      });

      // 比较并更新 (patch 比较新旧子树)
      patch(instance.subTree, newSubTree, container, anchor);
      instance.subTree = newSubTree;
    }
  }

  // 执行渲染effect
  setupRenderEffect();
}
```

### 注册组件生命周期

如 onMounted 生命周期函数 在 setup 中使用 hook 会被存储到当前组件实例 currentInstacne 的 mounted 数组属性中，然后在组件挂载前进行执行

```js
function onMounted(fn) {
  if (currentInstance) {
    // 将生命周期函数添加到instance.mounted 数组中
    currentInstacne.mounted.push(fn);
  } else {
    console.error(
      'onMounted 函数只能在setup中调用，且不能异步执行hook，因为setup的执行一次性的，等到异步执行hook时当前的实例currentInstance就不是当前这个实例'
    );
  }
}
```

#### 为什么异步注册 hook 会出现问题？

使用 setTimeout

```js
setup() {
  setTimeout(() => {
    onMounted(() => {
      console.log(666);
    });
  });
}
```

使用 Promise.resolve().then()

```js
setup() {
  Promise.resolve().then(() => {
    onMounted(() => {
      console.log(666);
    });
  });
}
```

结果：
<img src="/img/vue/异步注册hook结果.webp" alt="异步注册hook结果"  />

在 setup 中注册 hook，必须是同步的，因为注册的 compositionAPI 是注册到当前执行 setup 的组件对象实例中的，如果是异步的，那么异步任务会等到 setup 这个同步任务执行完毕之后才执行，这时候 currentInstance 已经被置为 null 了，而这时候执行再执行 onMounted 等 hook 时，在 hook 中需要使用到当前实例 currentInstance 来注册 hook，这时候 currentInstance 为 null 就会出现问题了，所以不能异步注册 hook。vue 会发出警告

所以注册 hook 不能异步，无论是微任务还是定时器宏任务都不行，微任务执行的时候是在当前宏任务结束之前，这时候 setup 已经执行完毕，currentInstance 为 null，已经不能给当前的组件实例注册 hook，定时器更加不行，是在下一次循环，当前栈清空之后才处理，所以等到执行 hook 的时候，currentInstance 也为 null，所以也注册不了 hook

<img src="/img/vue/不能异步注册hook.webp" alt="不能异步注册hook"  />

#### 组件响应式更新，onMounted 生命周期函数会被重新执行吗？

```js
function mountComponent(vnode, container, anchor) {
  // 省略部分代码

  effect(
    () => {
      const subTree = render.call(renderContext, renderContext);
      if (!instance.isMounted) {
        // 省略部分代码

        // 遍历 instance.mounted 数组并逐个执行即可
        instance.mounted &&
          instance.mounted.forEach((hook) => hook.call(renderContext));
      } else {
        // 省略部分代码
      }
      instance.subTree = subTree;
    },
    {
      scheduler: queueJob,
    }
  );
}
```

不会，只有组件未被挂载(!instance.isMounted)才会执行 onMounted，每当 render 函数中的响应式变量发生变化时，effect 中的内容会被更新。当组件再次更新的时候，组件已经挂载过了，所以此时不会执行 hook 了

#### vue 是异步更新的吗？为什么要异步更新呢？

执行自己的 render 方法即渲染组件内容，在执行 render 方法的时候包裹一层 effect 副作用函数，这样 render 方法中使用到的响应式变量发生了变化会触发当前 effect 的执行，又因为加入了调度器，所以在响应式变量发生变化的时候，执行调度器函数，在调度器里执行 effect 回调。

##### 为什么要这么做呢？

假如现在在组件内的 setup 中 for 循环修改 100 次响应式变量，此时不使用调度器的话那就会触发 effect100 次，而我们只需要最后一次更新即可，没必要更新 100 次，所以我们使用调度器就可以将 for 循环 100 次修改触发执行的 effect 回调添加到微任务中去处理，用 set 集合来存储有去重作用，这样等当前宏任务 for 循环 100 次执行完成后执行微任务，此时只触发更新一次 effect

#### 为什么 vue 实现组件化需要创建组件实例？

类似于执行上下文对象，用来存储组件化过程所需要的数据。包括组件是否已经挂载等信息。
有了组件实例后，在渲染副作用函数内，我们可以根据组件实例上的状态标识，来决定应该进行全新的挂载，还是应该打补丁。

## 异步组件与函数式组件

<img src="/img/vue/异步组件与函数式组件.webp"  alt="异步组件与函数式组件"  />

### 异步组件

如下是一个异步加载组件的例子

```js
const loader = () => {
  import('App.vue');
};
loader.then((App) => {
  createApp(App).mount('#app');
});
```

#### 用户通过 import 组件.then 的方法即可完成异步，为什么 vue 要在框架层面封装对异步组件的支持？

为了给用户提供更好的封装支持

1.  允许用户指定加载出错时要渲染的组件。
2.  允许用户指定 Loading 组件，以及展示该组件的延迟时间。
3.  允许用户设置加载组件的超时时长。
4.  组件加载失败时，为用户提供重试的能力。
    我们 defineAsyncComponent 来定义异步组件，并直接使用 components 组件选项来注册它。这样，在模板中就可以像使用普通组件一样使用异步组件了。

##### 错误处理组件

```js
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./MyComponent.vue'),
  errorComponent: ErrorComponent, // 指定加载出错时渲染的组件
});
```

##### Loading 组件

```js
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./MyComponent.vue'),
  loadingComponent: LoadingComponent, // 指定加载中的组件
});
```

##### 加载超时设置

```js
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./MyComponent.vue'),
  timeout: 3000, // 设置超时时间为 3000ms
});
```

##### 重试机制

```js
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./MyComponent.vue'),
  retry: true, // 允许重试加载
});
```

### 函数式组件

#### 什么是函数式组件？和普通组件有什么区别？

无状态的组件就是函数式组件，无状态就是没有 data 的组件对象，无需初始化 data 以及生命周期函数

有状态的组件即有 data 等状态的组件，无状态的组件就是函数式组件，只有虚拟节点和父组件传递的属性

## 内建组件和模块

<img src="/img/vue/内建组件和模块.webp"  alt="内建组件和模块"  />

### keepAlive

keepAlive 的本质是缓存管理，再加上特殊的挂载/卸载逻辑

keepAlive 组件的实现需要渲染器层面的支持，这是因为被 keepAlive 的组件在卸载时，我们不能真正将其卸载，否则就无法维持组件的当前状态了。正确的做法是：将被 keepAlive 的组件从原容器搬运到另一个隐藏的容器中，实现‘假卸载’。当被搬运到隐藏容器中的组件需要再次被‘挂载’时，我们也不能执行真正的挂载逻辑，而应该把该组件从隐藏容器中再搬运到原容器。这个过程对应到组件的生命周期，其实就是 activeated 和 deactivated

<img src="/img/vue/keeplive.webp" width='600px' alt="keeplive"  />

以下是源码大致实现，判断组件实例的 keepAliveCtx 是否为 true，如果是，则使用 move 函数将组件从隐藏容器中取出移动到指定容器中

```js
function mountComponent(vnode, container, anchor) {
  // 省略部分代码
  const instance = {
    state,
    props: shallowReactive(props),
    isMounted: false,
    subTree: null,
    slots,
    mounted: [],
    // 只有 KeepAlive 组件的实例下会有 keepAliveCtx 属性
    keepAliveCtx: null,
  };

  // 检查当前要挂载的组件是否是 KeepAlive 组件
  const isKeepAlive = vnode.type.__isKeepAlive;
  if (isKeepAlive) {
    // 在 KeepAlive 组件实例上添加 keepAliveCtx 对象
    instance.keepAliveCtx = {
      // move 函数用来移动一段 vnode
      move(vnode, container, anchor) {
        // 本质上是将组件渲染的内容移动到指定容器中，即隐藏容器中
        insert(vnode.component.subTree.el, container, anchor);
      },
      createElement,
    };
  }
  // 省略部分代码
}
```

### Teleport 组件

作用：将指定的内容渲染到特定的容器中，而不受 DOM 层级的限制

```js
function render() {
  return {
    type: Teleport,
    // 以普通 children 的形式代表被 Teleport 的内容
    children: [
      { type: 'h1', children: 'Title' },
      { type: 'p', children: 'content' },
    ],
  };
}
```

vnode.type 为 Teleport 组件

vnode 组件虚拟节点的 children 即插槽内容，在 Teleport 组件这里，children 内容为指定要渲染到特定容器的内容

使用

```html
<Teleport to="选择器">
  <!-- 需要挂载到目标位置的内容 -->
</Teleport>
```

Teleport 组件对象的源码大致实现，读取组件的 props 对象的 to 属性值即移动目标容器（Teleport 组件的插槽内容要移动到的指定容器）

```js
const Teleport = {
  __isTeleport: true,
  process(n1, n2, container, anchor, internals) {
    const { patch, patchChildren, move } = internals;
    if (!n1) {
      // 省略部分代码
    } else {
      // 更新
      patchChildren(n1, n2, container);
      // 如果新旧 to 参数的值不同，则需要对内容进行移动
      if (n2.props.to !== n1.props.to) {
        // 获取新的容器
        const newTarget =
          typeof n2.props.to === 'string'
            ? document.querySelector(n2.props.to)
            : n2.props.to;
        // 移动到新的容器
        n2.children.forEach((c) => move(c, newTarget));
      }
    }
  },
};
```

### Transition 组件

核心原理：

1. 当 DOM 元素被挂载时，将动效附加到该 DOM 元素上
2. 当 DOM 元素被卸载时，不要立即卸载 DOM 元素，而是等到附加到该 DOM 元素上的动效执行完成再卸载它

#### transition 虚拟节点

```js
const transitionVnode = {
  type: Transition,
  children: '插槽内容，即要添加动画的dom',
};
```

#### Transition 组件对象

添加动画就是取出插槽 dom 内容，给插槽内容添加一个 transition 属性对象，这个对象里面有进入前、进入、离开等回调来对插槽内容的各个阶段进行动效处理

```js
const Transition = {
  name: 'Transition',
  setup(props, { slots }) {
    return () => {
      // 通过默认插槽获取需要过渡的元素
      const innerVNode = slots.default();
      // 在过渡元素的 VNode 对象上添加 transition 相应的钩子函数
      innerVNode.transition = {
        beforeEnter(el) {
          // 省略部分代码
        },
        enter(el) {
          // 省略部分代码
        },
        leave(el, performRemove) {
          // 省略部分代码
        },
      };
      // 渲染需要过渡的元素
      return innerVNode;
    };
  },
};
```

Transition 组件本身不会渲染任何额外的内容，它只是通过默认插槽读取需要过渡动画的元素，并渲染需要过渡的元素

Transition 组件的作用，就是在过渡元素的虚拟节点上添加 transition 相关的钩子函数
