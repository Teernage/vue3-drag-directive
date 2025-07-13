# 编译优化

<img src="/img/vue/编译优化.webp" alt="编译优化"  />

编译优化是指编译器将模版编译为渲染函数的过程，优化的方向是尽可能地区分动态内容和静态内容，并针对不同的内容采取不同的优化策略

## 动态节点收集与补丁标志

### 传统 diff 算法遇到的问题

传统的 diff 算法无法避免新旧虚拟 dom 节点无用的比较操作

因为它在运行时得不到足够的关键信息，从而无法区分动态内容和静态内容，所以当响应式数据发生改变时，会生成一颗新的虚拟 DOM 树，再跟旧的虚拟 dom 树逐一进行比较和更新，这样效率不不高，为此 vue3 作了编译优化，跳过了无意义的 diff 操作，大幅提升性能

### vue3 描述动态节点的方式

用 patchFlag 来标记虚拟 dom 节点，只要存在该属性的 vnode，都认为是一个动态节点

### vue3 中的 Block 块

我们把 vnode 虚拟节点带有 dynamicChildren 属性的节点称为“块”，即 Block。所以，一个 Block 本质上也是一个虚拟 dom 节点，只不过它比普通的虚拟节点多出来一个用来存储动态子节点的 dynamicChildren 属性。

```js
const vnode = {
  tag: 'div',
  children: [
    { tag: 'div', children: 'foo' },
    { tag: 'p', children: ctx.bar, patchFlag: PatchFlags.TEXT }, // 这是动态节点
  ],
  // 将 children 中的动态节点提取到 dynamicChildren 数组中
  dynamicChildren: [
    // p 标签具有 patchFlag 属性，因此它是动态节点
    { tag: 'p', children: ctx.bar, patchFlag: PatchFlags.TEXT },
  ],
};
```

在 Vue 3 中，所有模板的根节点都会被编译为一个 Block 节点。任何包含 v-for、v-if/v-else-if/v-else 等条件性或迭代指令的节点也会被封装为 Block 节点。这是因为这些指令会导致节点及其子树根据数据的变化而动态生成或更新，因此其结构和内容是不确定的。

### vue3 如何收集动态节点进入 dynamicChildren 的？

在渲染函数内，对 createVNode 函数的调用是层层的嵌套结构，并且该函数的执行顺序是“内层先执行，外层后执行”

<img src="/img/vue/vnode的dynamicChildren属性.webp" alt="vnode的dynamicChildren属性"  />

当外层 createVNode 函数执行时，内层的 createVNode 函数已经执行完毕了。因此，为了让外层 Block 节点能够收集到内层动态节点，就需要一个栈结构的数据来临时存储内层的动态节点
以下代码中的 dynamicChildrenStack 就是来收集动态虚拟节点的

```js
//动态节点栈
const dynamicChildrenStack = [];
// 当前动态节点集合
let currentDynamicChildren = null;
// openBlock 用来创建一个新的动态节点集合，并将该集合压入栈中
function openBlock() {
  dynamicChildrenStack.push((currentDynamicChildren = []));
}
// closeBlock 用来将通过 openBlock 创建的动态节点集合从栈中弹出
function closeBlock() {
  currentDynamicChildren = dynamicChildrenStack.pop();
}
```

当使用 createVnode 来生成虚拟节点时，判断当前虚拟节点是否有 patchFlags 属性，如果有则将当前虚拟节点存储到 currentDynamicChildren 栈中

```js
function createVNode(tag, props, children, flags){
    const key = props && props.keyprops && delete props.key
    const vnode ={
        tag，
        props,
        children,
        key,
        patchFlags: flags
      }
    if (typeof flags !=='undefined'&& currentDynamicChildren){
       //动态节点，将其添加到当前动态节点集合中
         currentDynamicChildren.push(vnode)
      }
    return vnode
  }
```

根节点是 Block 节点

```js
render(){
//1.使用 createBlock 代替 createVNode 来创建 block
//2.每当调用 createBlock 之前，先调用 openBlock
return(
  openBlock(),
  createBlock('div', null,
  [
    createVNode('p',{class:'foo'},null, 1 /* patch flag */),
    createVNode('p',{ class:'bar'},null),
  ]
 ))
}
```

以下是 Block 节点的创建，根普通的虚拟的创建唯一的不同就是多了给虚拟节点添加 dynamicChildren 属性，将所有的动态子节点都会赋值给 dynamicChildren 属性

```js
function createBlock(tag, props, children) {
  //block 本质上也是一个 vnode
  const block = createVNode(tag, props, children);
  //将当前动态节点集合作为
  block.dynamicChildrenblock.dynamicChildren = currentDynamicChildren;
  // 关闭 block
  closeBlock();
  //返回
  return block;
}
```

由于 createVNode 函数和 createBlock 函数的执行顺序是从内向外，所以当 createBlock 函数执行时，内层的所有 createVNode 函数已经执行完毕了。这时，currentDynamicChildren 数组中所存储的就是属于当前 Block 的所有动态子代节点。因此，我们只需要将 currentDynamicChildren 数组作为 block.dynamicChildren 属性的值即可。这样，我们就完成了动态节点的收集。

当我们在比对新旧虚拟节点的时候，如果新虚拟节点有 dynamicChildren 属性，直接拿新旧虚拟节点的 dynamicChildren 动态节点集合进行比对并更新，这样就减少了静态节点的无意义比对

```js
function patchElement(n1,n2){
const el= n2.el = n1.el
const oldProps = n1.props
const newProps = n2.props

    //省略部分代码
  if(n2.dynamicChildren){
    //调用 patchBlockChildren 函数，这样只会更新动态节点
    patchBlockChildren(n1,n2)
  } else {
    patchChildren(n1,n2, el)
  }

 function patchBlockChildren(n1，n2){
         //只更新动态节点即可
    for(let i=0;i<n2.dynamicChildren.length; i++){
          patchElement(n1.dynamicChildren[i],n2.dynamicChildren[i])
     }
  }
}
```

### 渲染器的运行时支持

渲染器在更新标签节点时，使用 patchChildren 函数来更新标签的子节点。但该函数会使用传统虚拟 DOM 的 Diff 算法进行更新，这样做效率比较低。有了 dynamicChildren 之后，我们可以直接对比动态节点, 如下代码所示：

```js
function patchElement(n1, n2) {
  const el = (n2.el = n1.el);
  const oldProps = n1.props;
  const newProps = n2.props;

  // 省略部分代码

  if (n2.dynamicChildren) {
    // 调用 patchBlockChildren 函数，这样只会更新动态节点
    patchBlockChildren(n1, n2);
  } else {
    patchChildren(n1, n2, el);
  }
}

function patchBlockChildren(n1, n2) {
  // 只更新动态节点即可
  for (let i = 0; i < n2.dynamicChildren.length; i++) {
    patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i]);
  }
}
```

在修改后的 patchElement 函数中，我们优先检测虚拟 DOM 是否存在动态节点集合，即 dynamicChildren 数组。如果存在，则直接调用 patchBlockChildren 函数完成更新。这样，渲染器只会更新动态节点，而跳过所有静态节点。

动态节点集合能够使得渲染器在执行更新时跳过静态节点，但对于单个动态节点的更新来说，由于它存在对应的补丁标志，因此我们可以针对性地完成<span style='color:red'>靶向更新</span>，如以下代码所示：

```js
function patchElement(n1, n2) {
  const el = n2.el = n1.el
  const oldProps = n1.props
  const newProps = n2.props

  if (n2.patchFlags) {
    // 靶向更新
    if (n2.patchFlags === 1) {
      // 只需要更新 class
    } else if (n2.patchFlags === 2) {
      // 只需要更新 style
    } else if (...) {
      // ...
    }
  } else {
    // 全量更新
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key])
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null)
      }
    }
  }

  // 在处理 children 时，调用 patchChildren 函数
  patchChildren(n1, n2, el)
}
```

在 patchElement 函数内，通过检测补丁标志实现了 props 的靶向更新。这样就避免了全量的 props 更新，从而最大化地提升性能。

## Block 树

如果只有根节点是 Block 角色，是不会形成 Block 树的。既然会形成 Block 树，那就意味着除了根节点之外，还会有其他特殊节点充当 Block 角色

### 带有 v-if 指令的节点

```js
<div>
  <section v-if="foo">
    <p>{{ a }}</p>
  </section>
  <div v-else>
    <p>{{ b }}</p>
  </div>
</div>
```

假设只有最外层的 div 标签会作为 Block 角色。那么，当变量 foo 的值为 true 时，block 收集到的动态节点是：

```js
 cosnt block = {
   tag: 'div',
   dynamicChildren: [
     { tag: 'p', children: ctx.a, patchFlags: 1 }
   ]
   // ...
 }
```

假设只有最外层的 div 标签会作为 Block 角色。那么，当变量 foo 的值为 true 时，block 收集到的动态节点是：

```js
 cosnt block = {
   tag: 'div',
   dynamicChildren: [
     { tag: 'p', children: ctx.b, patchFlags: 1 }
   ]
   // ...
 }
```

所以会随着 foo 变量的值变化，动态节点集合也会随之改变，导致模版的不稳定，这样会使 diff 算法的效率降低，所以我们需要将 v-if 指令包裹的节点作为一个独立的 Block

### 带有 v-for 指令的节点

```js
<div>
  <p v-for="item in list">{{ item }}</p>
  <i>{{ foo }}</i>
  <i>{{ bar }}</i>
</div>
```

当 list 数组发生变化时，模版也会不稳定，导致 diff 算法的效率降低。所以我们需要将 v-for 指令包裹的节点作为一个独立的 Block

小结: vue3 会将根节点下面的动态子节点都收集进根虚拟节点的 dynamicChildren 属性数组中，这样在更新时，只需要比对 dynamicChildren 数组中的节点即可。在引入 block 树之后，会将带有 v-if 和 v-for 指令的节点作为一个独立的 Block。这样可以避免模版的不稳定，因为 vue 的 diff 对比的原则是同一层级，v-if、v-for 条件变化可能会导致生成的节点不同或节点顺序不同，这样对于直接遍历对比就有问题了，所以必须把可能改变顺序和数量的条件节点变成一个块，这样父层只需要对比新旧的子块 block 即可

## 静态提升

```html
<div>
  <p>static text</p>
  <p>{{ title }}</p>
</div>
```

在没有静态提升之前，每次组件更新时都会重新创建虚拟节点

```js
function render() {
  return (
    openBlock(),
    createBlock('div', null, [
      createVNode('p', null, 'static text'),
      createVNode('p', null, ctx.title, 1 /* TEXT */),
    ])
  );
}
```

但是静态节点是不会变化的，所以我们可以把静态节点提升到渲染函数之外，这样就不会每次更新都重新创建虚拟节点了

```js
// 把静态节点提升到渲染函数之外
const hoist1 = createVNode('p', null, 'text');

function render() {
  return (
    openBlock(),
    createBlock('div', null, [
      hoist1, // 静态节点引用
      createVNode('p', null, ctx.title, 1 /* TEXT */),
    ])
  );
}
```

静态 prop 的提升同理，静态属性也是不会变化的，所以也可以提升到渲染函数之外

如：

```vue
<div>
  <p foo="bar" a=b>{{ text }}</p>
 </div>
```

```js
// 静态提升的 props 对象
const hoistProp = { foo: 'bar', a: 'b' };

function render(ctx) {
  return (
    openBlock(),
    createBlock('div', null, [createVNode('p', hoistProp, ctx.text)])
  );
}
```

## 预字符串化

```html
<div>
  <p></p>
  <p></p>
  // ... 20 个 p 标签
  <p></p>
</div>
```

上面的模板中包含大量连续纯静态的标签节点，当采用了静态提升优化策略时，其编译后的代码如下：

```js
const hoist1 = createVNode('p', null, null, PatchFlags.HOISTED);
const hoist2 = createVNode('p', null, null, PatchFlags.HOISTED);
// ... 20 个 hoistx 变量
const hoist20 = createVNode('p', null, null, PatchFlags.HOISTED);

function render() {
  return (
    openBlock(),
    createBlock('div', null, [hoist1, hoist2 /* ...20 个变量 */, , hoist20])
  );
}
```

预字符串化能够将这些静态节点序列化为字符串，并生成一个 Static 类型的 VNode：

```js
const hoistStatic = createStaticVNode(
  '<p></p><p></p><p></p>...20 个...<p></p>'
);

function render() {
  return openBlock(), createBlock('div', null, [hoistStatic]);
}
```

这么做有几个明显的优势

- 大块的静态内容可以通过 innerHTML 进行设置，在性能上具有一定优势。
- 减少创建虚拟节点产生的性能开销。
- 减少内存占用

## 缓存内联事件处理函数

内敛事件处理函数基本上是不会变化的，所以我们可以缓存起来。这样可以避免不必要的更新操作。

缓存内联事件处理函数可以避免不必要的更新。假设模板内容如下：

```html
<Comp @change="a + b" />
```

上面这段模板展示的是一个绑定了 change 事件的组件，并且为 change 事件绑定的事件处理程序是一个内联语句。对于这样的模板，编译器会为其创建一个内联事件处理函数，如下面的代码所示：

```js
function render(ctx) {
  return h(Comp, {
    // 内联事件处理函数
    onChange: () => ctx.a + ctx.b,
  });
}
```

每次重新渲染时（即 render 函数重新执行时）​，都会为 Comp 组件创建一个全新的 props 对象。同时，props 对象中 onChange 属性的值也会是全新的函数。这会导致渲染器对 Comp 组件进行更新，造成额外的性能开销。为了避免这类无用的更新，我们需要对内联事件处理函数进行缓存

```js
function render(ctx, cache) {
  return h(Comp, {
    // 将内联事件处理函数缓存到 cache 数组中
    onChange: cache[0] || (cache[0] = ($event) => ctx.a + ctx.b),
  });
}
```

渲染函数的第二个参数是一个数组 cache，该数组来自组件实例，把内联事件处理函数添加到 cache 数组中。这样，当渲染函数重新执行并创建新的虚拟 DOM 树时，会优先读取缓存中的事件处理函数。这样，无论执行多少次渲染函数，props 对象中 onChange 属性的值始终不变，于是就不会触发 Comp 组件更新了。

## v-once

```js
<section>
  <div v-once>{{ foo }}</div>
</section>
```

如果应用了 v-once 指令，那么该节点就会被标记为静态内容,不会被收集进根节虚拟节点的 dynamicChildren 数组中，这样在更新时，就不会对比该节点了

## 总结

编译优化的核心在于，区分动态节点与静态节点。Vue.js 3 会为动态节点打上补丁标志，即 patchFlag。同时，Vue.js 3 还提出了 Block 的概念，一个 Block 本质上也是一个虚拟节点，但与普通虚拟节点相比，会多出一个 dynamicChildren 数组。该数组用来收集所有动态子代节点，这利用了 createVNode 函数和 createBlock 函数的层层嵌套调用的特点，即以“由内向外”的方式执行。再配合一个用来临时存储动态节点的节点栈，即可完成动态子代节点的收集。

由于 Block 会收集所有动态子代节点，所以对动态节点的比对操作是忽略 DOM 层级结构的。这会带来额外的问题，即 v-if、v-for 等结构化指令会影响 DOM 层级结构，使之不稳定。这会间接导致基于 Block 树的比对算法失效。而解决方式很简单，只需要让带有 v-if、v-for 等指令的节点也作为 Block 角色即可

除了 Block 树以及补丁标志之外，Vue.js 3 在编译优化方面还做了其他努力，具体如下

- 静态提升：能够减少更新时创建虚拟 DOM 带来的性能开销和内存占用。

- 预字符串化：在静态提升的基础上，对静态节点进行字符串化。这样做能够减少创建虚拟节点产生的性能开销以及内存占用。

- 缓存内联事件处理函数：避免造成不必要的组件更新。

- v-once 指令：缓存全部或部分虚拟节点，能够避免组件更新时重新创建虚拟 DOM 带来的性能开销，也可以避免无用的 Diff 操作。

注意点：
vue 的组件更新粒度是组件级的，某个组件的响应式变量更新了只会触发这个组件的 render 函数重新执行，某个组件中的响应式变量修改之后触发的 effect 副作用函数就是对应组件的 render 函数。vue 的组件的模板编译之后都是一棵虚拟 dom 树

Vue 的组件更新粒度
组件级更新：

Vue 的更新机制确实是组件级的，也就是说，只有当某个组件的响应式变量发生变化时，Vue 会触发该组件的 render 函数重新执行，生成新的虚拟 DOM，并与旧的虚拟 DOM 进行比对。这种局部更新的策略使得 Vue 在渲染时更高效，避免了不必要的整棵树的更新。
子组件更新影响父组件：

在 Vue 中，如果一个子组件的响应式数据发生变化，通常这个变化是通过父组件的 props 传递下去的。这种情况下，虽然子组件的 render 函数会重新执行，但如果子组件是通过 props 传递数据的，父组件的响应式数据没有变化，父组件的 render 函数不会因此而被触发。
然而，如果子组件内部的状态改变并且这个状态被设计成影响父组件（通过 $emit 方式通知父组件，或者通过 Vuex 等状态管理工具），那么父组件可以根据需要重新渲染。

在没有做编译优化的情况下，每个 vue 组件的更新都会触发 render 函数重新执行，也就会重新生成一棵虚拟 dom 树来跟旧的虚拟 dom 树进行比对，找到不同之处再进行更新。

在有编译优化的时候，每个组件的根虚拟节点都有一个 dynamicChildren 属性，这个 dynamicChildren 数组会存储当前这棵树的所有动态节点，这样当我们某个组件进行更新的时候，vue 会执行 render 函数重新生成一棵树，这个时候只需要 vue 只需要读取这个组件的根节点的 dynamicChildren 属性进行遍历进行新旧虚拟 dom 节点的比对即可

```js
class VNode {
  constructor(tag, props, children, dynamic = false) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.dynamic = dynamic;
    this.dynamicChildren = [];
  }
}
```

虽然遍历树的时间复杂度和遍历根节点的 dynamicChildren 数组的时间复杂度都是 O(N)，量级是一样的，10 和 90 都是 10 位，不过 10 遍历的更少一点，这里也是一样的道理，N 代表树的所有节点，但是 dynamicChildren 里面只有动态节点，遍历 dynamicChildren 数组可以减少一些静态节点的无意义比对，而且 dynamicChildren 数组是树形数据的扁平化处理，数组是一块连续的内存空间，更有利于 cpu 缓存利用，而且遍历 dynamicChildren 不需要像遍历树一样递归遍历，减少了一些函数调用的开销(不过递归可以用循环和栈来模拟，这里指的是一般情况下树的遍历是递归如 dfs 深度优先搜索算法)
