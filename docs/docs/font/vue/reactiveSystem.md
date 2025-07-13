# 响应式系统的作用与实现

## 副作用函数 与 响应式数据

<img src="/img/vue/副作用函数与响应式数据.webp" alt="副作用函数与响应式数据"  />

### 副作用是什么？

- 在编程中，副作用是指函数或表达式对程序状态<span style='color:red'>产生</span>了可观察的<span style='color:red'>变化</span>，而这种变化不是由函数的返回值所反映的。换句话说，副作用是指函数对函数作用域之外的数据进行了修改，或者执行了与计算函数返回值无关的操作。 副作用函数是指具有副作用的函数，它可能会对外部状态进行修改，例如修改全局变量、发起网络请求、读写文件等。这些操作都属于副作用，因为它们会改变程序的状态，但不一定会通过函数的返回值来体现。 在函数式编程中，副作用被认为是一种不好的编程实践，因为它会增加程序的复杂性，使得程序更难以理解和调试。函数式编程鼓励使用纯函数，即没有副作用的函数，这样可以更好地控制程序的状态和行为。

- 举个简单的例子，下面的 updateCounter 函数就是一个具有副作用的函数：

```javaScript
 let counter = 0;
 function updateCounter(value) {
   // 修改了外部状态 counter
    counter += value;
 }
```

在这个例子中，updateCounter 函数对外部状态 counter 进行了修改，而这种修改不会通过函数的返回值来反映。因此，updateCounter 函数就是一个具有副作用的函数。 相对应的，下面是一个没有副作用的纯函数的例子：

```javaScript
function add(a, b) {
  // 只通过返回值反映了计算结果，没有副作用
    return a + b;
}
```

在这个例子中，add 函数只通过返回值来反映计算结果，没有对外部状态进行修改，因此它是一个纯函数。 总的来说，副作用函数是指具有副作用的函数，它们可能会对外部状态进行修改，而这种修改不一定会通过函数的返回值来体现。在函数式编程中，尽量避免使用副作用函数是一种良好的编程实践。

### vue3 中副作用函数指的是什么？

在 Vue 3 中，当使用 computed、watch 等响应式 api 时，如果这些函数引用了 ref 变量或者 reactive 变量，Vue 3 会将这些回调函数视为“副作用函数”。这是因为这些函数可能会对响应式数据进行读取或者修改，从而产生了副作用。这些回调就会被依次收集起来，等到变量发生改变，就会依次执行这些回调

#### 依赖收集的时候 activeEffect 会不会对应错？

- vue3 源码是这样实现的: effect(fn 回调)在执行的时候就会把 fn 赋值给全局的 activeEffect，然后立即执行 fn 回调，如果此时 fn 回调中有读取响应式变量 ref 或 reactive 的话，那么就会触发 proxy 的 get 方法，在 get 方法中对 activeEffect 进行依赖收集，所以这是一次性的，立马执行，等下一个 effec(fn2)执行的时候，fn2 就赋值给全局变量 activeEffect,如果 fn2 有引用响应式变量，那么 fn2 就会被收集(即当前的 activeEffect),如果没有就不会收集，所以执行第一个 fn 回调的时候 activeEffect 就是 fn，第二个的时候 activeEffect 就是 fn2，不会对应错

```javaScript
let activeEffect = null; // 全局变量

function effect(fn) {
  activeEffect = fn;    // 设置当前活跃的effect
  fn();                 // 立即执行回调
  activeEffect = null;  // 执行完后清空
}
```

执行流程：

- 当执行 effect(fn1)时：activeEffect = fn1
  执行 fn1，触发响应式对象的 get，收集 fn1 作为依赖
  activeEffect 重置为 null

- 当执行 effect(fn2)时：activeEffect = fn2
  执行 fn2，触发响应式对象的 get，收集 fn2 作为依赖
  activeEffect 重置为 null

#### vue3 中是如何收集 effect 副作用回调的？

- 首先 vue3 定义了一个全局的 WeakMap,这个 weakMap 的 key 是响应式对象，value 是 Map 对象
- 对应的 Map，每个 Map 的 key 是对象的属性，value 是属性对应的依赖集合是 set
- 所以 结构是 WeakMap ---> Map ----> set
- WeakMap 存储着所有的对象对应的 Map，Map 存储着对象内所有属性对应的 set 依赖集合

```javaScript
// 全局的依赖收集容器
const targetMap = new WeakMap();

// 依赖收集的过程
function track(target, key) {
  if (!activeEffect) return;

  // 1. 先从 WeakMap 中获取 target 对应的 Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 2. 再从 Map 中获取属性 key 对应的 Set
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  // 3. 将当前的 activeEffect 添加到 Set 中
  dep.add(activeEffect);
}
```

这种结构的优点：

- WeakMap 使用弱引用，可以防止内存泄露
- Map 可以用对象属性作为 key
- Set 保证了依赖的唯一性

具体对应关系：

```javaScript
WeakMap: {
  响应式对象1 => Map: {
    属性1 => Set[effect1, effect2...],
    属性2 => Set[effect3, effect4...]
  },
  响应式对象2 => Map: {
    属性1 => Set[effect5, effect6...]
  }
}
```

#### 为什么存储对象要用 WeakMap 能防止内存泄露?

WeakMap 对 key 是弱引用，不影响垃圾回收器的工作。如果没有其他引用指向这个键所对应的对象，那么这个对象就可以被垃圾回收。这种特性对于管理和追踪组件或对象的响应式依赖是非常有用的。

例如：

```javaScript
const reactiveMap = new WeakMap();
function createReactiveObject(target) {
    const observed = new Proxy(target, handler);
    reactiveMap.set(target, observed);
    return observed;
 }

 const original = { count: 1 };
 const observed = createReactiveObject(original);
  // 假设现在 original 没有其他引用
  original = null;
  // 这时，original 对象只被 reactiveMap 中的 WeakMap 引用
  // 由于 WeakMap 的键是弱引用的，original 可以被垃圾回收
```

在上述例子中，original 对象被 createReactiveObject 函数处理并包装成一个响应式对象 observed。这个 original 对象作为键被存储在 reactiveMap 的 WeakMap 中。一旦 original 对象在应用中的其他地方不再被引用（例如，我们将其设置为 null），它将成为垃圾回收的候选对象，尽管它仍然作为一个键存在于 WeakMap 中。  
在 Vue 3 的响应式系统中，一个组件的依赖通常是组件实例中的响应式属性。当组件被销毁时，通常是因为它不再被任何父组件引用，那么该组件的实例及其响应式属性也将不再有引用。由于这些响应式属性作为键存储在 WeakMap 中，它们可以被垃圾回收，因为没有其他地方引用这些键。  
这个机制的好处是，Vue 3 的开发者不需要担心组件销毁后手动清理依赖，WeakMap 为响应式系统提供了一个内置的垃圾回收机制，这样可以防止内存泄漏并保持应用的性能。

总结一下，Vue 3 使用 WeakMap 来存储对象的响应式代理的原因：

- **自动垃圾回收**: 当代理对象不再被引用时，它可以被自动回收。
- **内存优化**: 防止因长期持有已不再需要的对象的引用而导致的内存泄漏。
- **性能考虑**: 避免手动清理依赖关系，减少性能开销。 在实际场景中，当一个组件被销毁或者响应式对象不再被需要时，如果没有其他引用，这些对象就会从 WeakMap 中被清除，这符合垃圾回收的机制。

```javaScript
// 组件中使用响应式数据
const Component = {
    setup() {
        const state = reactive({
            count: 0
        });
        return { state };
    }
}

// 当组件被卸载时
instance = null; // 组件实例被销毁

/**
      此时发生的事情：
   1. 组件实例被销毁，失去对state的引用
   2. 原始对象{ count: 0 }没有其他引用,因为{ count: 0 }作为key被存储在
      WeakMap 中,weakMap 弱引用，所以state对象会被自动回收
*/
```

#### 为什么执行 effect 回调之前需要将当前的 effect 回调从所有收集到该 effect 回调的依赖集合中清除？

```javaScript
const data = { ok: true, text: 'hello world' }
const obj = new Proxy(data, { /* ... */ })

effect(function effectFn() {
 document.body.innerText = obj.ok ? obj.text : 'not'
})
```

当这个 effect 执行的时候，会执行 effectFn 回调，当 obj.ok 为 true 的时候，此时 effectFn 回调会读取 obj.ok 和 obj.text 两个属性，这时候会触发 obj 的 proxy 中 ok 和 text 的 get 方法，在 get 方法中对当前回调进行依赖收集。 但是有一个问题就是当 obj.ok 设置为 false 了，此时触发 ok 收集的 effectFn 回调再次执行，这时候 obj.text 不会被读取，按道理是不应该还保留在 obj.text 的依赖集合中的，但是没有被删除，就会导致其他地方修改到 obj.text 的值的时候，当前的 effectFn 回调会被触发执行，引起不必要的变更

所以 vue3 中采取了一种解决方案就是：  
 例如，在 obj.ok 为 true 的时候，此时 effectFn 回调会被收集到 obj.ok 和 obj.text 的依赖集合中，在触发 ok 和 text 的 track 依赖操作的时候，把当前的 obj.ok 和 text 的依赖集合都添加到 effectFn 回调的数组中(因为这两个属性都读取到当前 effectFn 回调)，

在依赖收集时： 当前活跃的副作用函数 effectFn 会添加到对象属性的依赖集合 deps 中。同时，这个依赖集合也会被记录在 effectFn.deps 属性数组中（activeEffect 表示当前激活的副作用函数）。这样，在后续重新收集依赖之前，可以通过清除 effectFn 在各个依赖集合中的引用来确保有效性。

```javaScript
// 把当前激活的副作用函数添加到依赖集合 deps 中
 deps.add(activeEffect)   // deps是某个key的依赖收集集合
 // deps 就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到 activeEffect.deps 属性数组中
 activeEffect.deps.push(deps)
```

这样在触发 effectFn 回调的时候先把当前的 effectFn 回调从各个依赖集合中删除，然后再执行 effectFn

```javaScript
 // 用一个全局变量存储被注册的副作用函数
  let activeEffect
   function effect(fn) {
         const effectFn = () => {
         // 调用 cleanup 函数完成清除工作 cleanup中遍历的是
         // activeEffect.deps.push(deps) 引用到当前effect副作用回调的所有依赖set集合
         cleanup(effectFn)
         activeEffect = effectFn
         fn()
      }
       effectFn.deps = [] // // 清空当前effectFn副作用函数的deps属性集合
       effectFn() // 执行副作用函数，这样副作用函数中如果有响应式变量，这些变量的依赖集合会收集到当前 effectFn 回调
 }

/**
 effectFn.deps 记录了当前副作用函数关联的所有属性依赖集合，包含多个对象不同属性的依赖追踪。
 cleanup 函数会遍历 effectFn.deps 数组，将所有依赖集合中删除当前活跃副作用函数 effectFn。
 */
 function cleanup(effectFn) {

    for (const deps of effectFn.deps) {
        deps.delete(effectFn); // 从所有依赖集合中删除 effectFn
    }
    effectFn.deps.length = 0; // 清空当前effectFn副作用函数的deps属性集合
}
```

这样一开始 obj.ok 为 true，effectFn 回调会被 ok 和 text 两个依赖集合，当 obj.ok 为 false 的时候，此时就应该只有 ok 收集 effectFn 回调，text 依赖集合中不应该有了，所以当 obj.ok 为 false 的时候，执行 effectFn 回调之前会清空所有依赖集合中的 effectFn 回调(如上的 obj.text 和 obj.ok 的依赖集合)，然后再执行 effectFn，这样再执行 effectFn 回调的时候读取到的只有 ok，那么触发的就是 ok 的 track 依赖收集了，这样就能解决上面的问题

注意： 记得在 trigger 中的执行依赖集合的时候，将集合克隆另一个再遍历执行，因为收集到的 effct 在执行之前都会从所有的 set 依赖集合中删除，然后再执行 effect 回调，然后回调中又会触发依赖收集进 set 集合中，set 特性：如果 set 中不断的有删除和新增，那么在遍历就不会停下来即永远遍历不完，这样就会导致死循环，所以记得在 trigger 触发 set 集合的时候先克隆再遍历

```javaScript
function trigger(target, key) {
    const deps = getDeps(target, key)
    const effectsToRun = new Set(deps) // 克隆集合

    effectsToRun.forEach(effectFn => {
        effectFn() // 安全地执行
    })
}
```

通过克隆 effectsToRun 集合并遍历执行 effectFn，在执行回调前移除其在 deps 依赖集合中的引用，可以有效避免因在同一集合中重复删除和添加而引发的无限循环，进而确保依赖触发机制的稳定性。

#### 为什么在 trigger 时不执行当前正在执行的 activeEffect？

举例：

```javaScript
 effect(() => {￼
     obj.foo++  //  obj.foo = obj.foo + 1￼
  })
```

我们可以把 obj.foo++ 这个自增操作分开来看，它相当于 obj.foo = obj.foo + 1 在这个语句中，既会读取 obj.foo 的值，又会设置 obj.foo 的值，而这就是导致问题的根本原因。我们可以尝试推理一下代码的执行流程：首先读取 obj.foo 的值，这会触发 track 操作，将当前副作用函数收集到“依赖集合”中，接着将其加 1 后再赋值给 obj.foo，此时会触发 trigger 操作，即把“桶”中的副作用函数取出并执行。但问题是该副作用函数正在执行中，还没有执行完毕，就要开始下一次的执行。这样会导致无限递归地调用自己，于是就产生了栈溢出。

所以需要执行 trigger 触发依赖集合的副作用回调执行的时候需要过滤掉当前正在执行的副作用回调，即 activeEffect

### effect 的实现

<img src="/img/vue/effect的实现.webp" alt="effect的实现"  />

effect 函数实现

```javaScript
export function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler); // 创建 ReactiveEffect 实例
    // 将用户传递过来的值合并到_effect实例上
    extend(_effect, options); // 扩展选项
    // 如果不是 lazy，就立即执行副作用函数
    if (!options.lazy) {
        _effect.run(); // 立即执行
    }

    // 返回可以由用户停止的 runner 函数
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect; // 为 runner 绑定 effect
    return runner; // 返回 runner
}

// 扩展函数
function extend(target, options) {
    Object.keys(options).forEach(key => {
        target[key] = options[key]; // 将选项属性添加到目标
    });
}
```

ReactiveEffect 类及其方法

```javaScript
let activeEffect = void 0; // 当前激活的副作用
let shouldTrack = false; // 是否应该追踪依赖
const targetMap = new WeakMap(); // 用于依赖收集

export class ReactiveEffect {
    active = true; // 是否激活
    deps = []; // 依赖集合
    public onStop: () => void | undefined; // 停止时的回调

    constructor(public fn, public scheduler?) {
        console.log("创建 ReactiveEffect 实例");
    }

    run() {
       // 执行fn但是不收集依赖，根据active判断是否需要收集依赖，如果为false则不往下执行收集依赖
        if (!this.active) {
            return this.fn(); // 如果未激活，直接返回函数结果
        }
        // 执行fn收集依赖，可以开始收集依赖
        shouldTrack = true;
        // 执行的时候给全局的 activeEffect 赋值，其他地方就可以利用全局属性来获取当前的effect副作用回调
        activeEffect = this as any; // 设置当前激活的 effect
        // 将当前副作用函数从各个依赖集合中删除
        this.cleanup()
         // 执行副作用函数，收集依赖
        const result = this.fn();
        shouldTrack = false; // 停止收集依赖
        activeEffect = undefined; // 清空当前激活的 effect

        return result; // 返回执行结果
    }

    stop() {
        if (this.active) {
            this.cleanup(); // 清理依赖
            this.active = false; // 将 active 设置为 false
        }
    }

    cleanup() {
        if (this.onStop) {
            this.onStop(); // 调用停止时的回调
        }
    }
}
```

cleanupEffect 函数

```javaScript
function cleanupEffect(effect) {
    // 从所有包含当前 effect 回调的依赖中删除这个 effect
    effect.deps.forEach(dep => {
        dep.delete(effect); // 从依赖集合中移除
    });
    effect.deps.length = 0; // 清空依赖数组
}
```

## 基于 proxy 实现的响应式

### 核心逻辑

数据的读取：getter 行为 如以下：obj.text 触发响应式 proxy 对象的 get 方法触发 track 收集依赖

```javaScript
document.body.innerText =  obj.text
```

数据的修改：setter 行为 如以下：obj.text 赋值，触发 obj 响应式 proxy 对象的 set 方法---> 触发 trigger，执行收集的 effect 副作用函数依赖集合

```javaScript
obj.text = 'hello world'
```

#### getter 行为

Proxy 对象属性读取时触发 getter。
触发 getter 会调用 track 函数，进行依赖收集。

<img src="/img/vue/响应式getter.webp" alt="响应式getter"  />

track 函数

```javaScript
export function track(target, type, key) {
    // 检查是否正在追踪
    if (!isTracking()) {
        return;
    }

    console.log(`触发追踪 -> target: ${target} type: ${type} key: ${key}`);

    // 基于 target 查找对应的依赖集合
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        // 初始化 depsMap
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }

    // 查找关键字对应的依赖
    let dep = depsMap.get(key);
    if (!dep) {
        // 创建新的依赖集合
        dep = createDep();
        depsMap.set(key, dep);
    }

    // 追踪依赖
    trackEffects(dep);
}

export function trackEffects(dep) {
    // 检查是否已经存在 activeEffect
    if (!activeEffect) return;

    // 向依赖集合中添加 activeEffect
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        // 对于每个 activeEffect，记录所依赖的 dep
        (activeEffect as any).deps.push(dep);
    }
}
```

<img src="/img/vue/track函数.webp" alt="track函数"  />

#### setter 行为

Proxy 对象属性设置时触发 setter。
触发 setter 会调用 trigger 函数，进行依赖收集。

<img src="/img/vue/响应式setter.webp" width='200' alt="响应式setter"  />

trigger 函数

```javaScript
// 存储目标的依赖映射
const targetMap = new WeakMap();

/**
 * 触发响应式更新的函数
 */
export function trigger(target, type, key) {
    // 1. 收集所有的 dep 放到 deps 中
    let deps = []; // 初始收集的依赖数组

    const depsMap = targetMap.get(target);
    if (!depsMap) return; // 如果没有找到目标的依赖映射，直接返回

    const dep = depsMap.get(key); // 获取该 key 的依赖
    if (dep) {
        deps.push(dep); // 将依赖添加到收集数组中
    }

    // 收集到的所有 effect
    const effects = []; // 存储所有的 effect
    deps.forEach((dep) => {
        // 将 dep 中的所有 effect 收集到 effects 数组中
        effects.push(...dep);
    });
   //  注意：这里的dep是用数组将要执行的set依赖集合中的元素存储进来的，
   // 执行依赖集合的遍历操作的时候遍历的是dep而不是原先的set集合，目的是为了解决触发依赖集合
   // 是死循环的问题，因为如果正在执行的set集合有新增或删除的操作，那么set会继续遍历，
   // (语法规范：set特性：如果set中不断的有删除和新增，那么在遍历就不会停下来即永远遍历不完，
   // 这样就会导致死循环，所以记得在trigger触发set集合的时候先克隆再遍历),所以在执行set依赖集
   // 合的时候如果对set集合有影响，那么就会一直循环，一直占用主线程，导致页面卡死

    // 触发依赖的实际更新
    triggerEffects(createDep(effects));
}

/**
 * 执行所有收集到的 effect 的 run 方法
 */
export function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            // 如果使用了 scheduler，调用 scheduler 方法
            effect.scheduler();
        } else {
            // 否则直接运行 effect
            effect.run();
        }
    }
}

/**
 * 创建依赖集合
 *  */
function createDep(effects) {
    const dep = new Dep();
    effects.forEach(effect => dep.add(effect)); // 添加副作用
    return dep; // 返回依赖实例
  }
```

<img src="/img/vue/trigger函数.webp"  alt="trigger函数"  />

## 调度系统(scheduler)

### 响应性的可调度性

当数据更新，触发副作用函数重新执行时，有能力决定：副作用函数(effect)执行的时机、次数以及方式，比如实现了 scheduler 之后，下次触发 effect 回调执行就不会直接执行 effect 回调，而是执行 scheduler 对象里的方法，我们可以在这个 scheduler 里作一些处理

```javaScript

// 创建一个响应式对象
const state = reactive({
  count: 0
});

// 定义调度器
const scheduler = (fn) => {
  console.log('调度器触发');
  setTimeout(fn, 1000); // 延迟1秒执行副作用
};

// 创建副作用
effect(() => {
  console.log(`当前计数: ${state.count}`);
}, {
  scheduler // 使用定义的调度器
});


state.count++; // 每次更新时，不会立即执行副作用，而是调用调度器
state.count++; // 再次更新，仍然是由调度器控制，还是调用调度器
```

## 计算属性(computed)

本质：一个属性值，当依赖的响应式数据发生变化时，重新计算

只有当读取计算属性的值时，才会执行 effectFn 并将其结果作为返回值返回

<span style='color:red'>实现原理</span>：
1.effect 副作用函数 2. 依赖收集和触发 3.采用 scheduler 调度系统

- 我们新增了两个变量 \_value 和 dirty，其中 value 用来缓存上一次计算的值，而 dirty 是一个标识，代表是否需要重新计算。当我们通过 sumRes.value 访问值时，执行 sumRes 实例的 get value 方法获取 computed 对象的值(返回\_value 属性的值)，只有当 dirty 为 true 时才会调用 effectFn 重新计算值，否则直接使用上一次缓存在 \_value 中的值。这样无论我们访问多少次 sumRes.value，都只会在第一次访问时进行真正的计算，后续访问都会直接读取缓存的 value 值。
- 我们为 effect 添加了 scheduler 调度器函数，它会在 getter 函数中所依赖的响应式数据变化时执行，这样我们在 scheduler 函数内将 dirty 重置为 true，当下一次访问 sumRes.value 时，就会重新调用 effectFn 计算值，这样就能够得到预期的结果了。

<img src="/img/vue/computed原理.webp"  alt="computed原理"  />

### computed 源码

```javaScript
export class ComputedRefImpl {
    public dep: any; // 存储依赖的对象集合，computed 依赖的 effect 通过这个集合管理
    public effect: ReactiveEffect; // effect 响应式对象，负责计算 computed 值
     //_dirty:当前的值是否需要更新、如果为true，那么说明读取computed值的需要更新、本来是直接更新的，但是competed的特性是:只有在读取computed响应式对象。value的时候才触发更新effect副作用回调，所以才用dirty变量来标记
    private _dirty: boolean;
    private _value: any; // 存储 computed 的当前值

    constructor(getter) {
        this._dirty = true; // 初始状态为需要更新
        this.dep = createDep(); // 创建一个依赖集合
        this.effect = new ReactiveEffect(getter, () => {
        // scheduler 只要触发了这个函数说明响应式对象的值发生改变了，那么就解锁，后续在调用 get 的时候就会重新执行effect回调(如:computed(()=>{return obj.a })即computed方法中的回调函数)，所以会得到最新的值 if (this._dirty) return; // 如果已经标记为 dirty，直接返回
             this._dirty = true; // 标记为需要更新
             triggerRefValue(this); // 触发更新，更新依赖项
        });
    }

    /**
     * 获取 computed 对象的值
     */
    get value() {
        trackRefValue(this); // 收集依赖
        // 仅在 _dirty 为 true 时更新值
        if (this._dirty) {
            // 锁上，只可以调用一次 当数据改变的时候才会解锁 这里就是缓存实现的核心 解锁是在 scheduler 里面做的
            this._dirty = false; // 重置 _dirty 状态
            this._value = this.effect.run(); // 执行 effect 并更新 _value
        }
        return this._value; // 返回当前值
    }
}
```

实现 ComputedRefImpl 类来实现 getter 依赖收集的，使用 var c = computed(<span style='color:red'>()=>{return obj.a}</span>)这个 API 的时候，这个标红的副作用回调会作为入参交给 Vue 内部的 ReactiveEffect，等到执行 c.value 的时候触发 ComputedRefImpl 实例的 get value 方法，这时候才执行 ReactiveEffect 实例的 run 方法(即执行标红的回调<span style='color:red'>()=>{return obj.a}</span>), 执行标红的回调的时候读取响应式对象的属性 obj.a 的时候，这个标红的回调(即当前的 activeEffect)就会被 obj.a 这个依赖集合所收集，不过当 obj.a 发生改变的时候，不会再触发标红的回调了， 因为给 ReactiveEffect 实例传了 scheduler 调度器，所以当触发 obj.a 的改变时，执行的是调度器里的内容(修改 dirty 变量),这样等到下次执行 c.value 的时候，触发 get 方法就会重新执行 ReactiveEffect 实例的 run 方法(那么就会立即触发执行标红的 effect 回调即<span style='color:red'>()=>{return obj.a}</span>)。这样 c.value 的值就是最新的

## watch 的实现原理

- 本质: 观测一个响应式数据，当数据发生变化时，通知并执行响应的回调函数(在 scheduler 中实现副作用函数的执行)

- 实现原理：1.effect <span style='color:red'>惰性执行</span> 2. 依赖收集和触发 3.scheduler 调度系统

watch 的原理使用了 effect 函数的惰性执行和调度器，情性执行实现 watch 使用的时候不会立即执行副作用函数（即下方的 getter），调度器实现了响应式变量发生变化时，不再是立即触发 getter 副作用回调的执行，而是触发 scheduler 的执行，然后在 scheduler 里执行用户传入的 cb，这样就实现了 watch

### 惰性执行

#### lazy 选项的定义与作用

- 作用: 当 lazy 设置为 true 时，effect 函数不会在创建时立即执行。相反，它会返回一个执行函数（effectFn），只有在后续明确调用 effectFn 时，才会运行这个 effect 函数

<img src="/img/vue/watch源码.webp" alt="watch源码"  />

### watch 源码

```javaScript
/*
watch的原理使用了effect函数的惰性执行和调度器，情性执行实现watch使用的时候不会立即执行副作用函数（即下方的getter），调度器实现了响应式变量发生变化时，不再是立即触发getter副作用回调的执行，而是触发scheduler的执行，然后在scheduler里执行用户传入的cb，这样就实现了watch
* @param source 监听，可以是对象或者函数
* gparam cb 用户传递的callback 监听对象source发生变化的时候触发schduler，执行cb
*/
function watch(source, cb) {
    let getter;
    //如果是source表示是getter，可以直接赋值
    if (typeof source === "function") {
        getter = source;
    }else {
        getter = () => traverse(source); // 深度遍历对象
    }

    let oldValue, newValue;
    const effectFn = effect(
         () => getter(), // 这个就是传递的 fn
        // 下边这个是 option 开启了 lazy 特性和 scheduler 调度器来控制用户传递的第二个属性 callback 何时执行
         {
            // 开启 lazy 选项，将返回值存储到 effectFn 中以便于之后手动调用
            lazy: true,
            scheduler() {
              newValue = effectFn(); // 值变化时再次运行 effect 函数，获取新值
             cb(newValue, oldValue);
             // 更新旧值，不然下次得到的是错误的旧值
             oldValue = newValue;
         }
  }
  // 手动调用副作用函数，拿到的值是旧值
  oldValue = effectFn();
)

    // 手动执行一次以获取初始值
    oldValue = effectFn();
}

/**
 * 遍历获取 value 对象，在 watch 这里的作用
 * 就是让 value 对象中的每一个属性依赖收集
 * 都对应当前的 effect 副作用函数进行收集
 */
function traverse(value, seen = new Set()) {
  // 如果获取的数据是原始值，或已经读取过应数据，则什么也不做
  if (!isObject(value) || seen.has(value)) return;

  // 将数据添加到 seen 中，表示遍历过数据，避免循环引发导致死循环
  seen.add(value);

  // 对数据对象进行遍历读取，用于依赖收集
  for (const k in value) {
    traverse(value[k], seen);
  }
  return value;
}
```

watch 源码中，effect 函数中开启了 lazy 属性为 true，而且传入了 scheduler 调度器，这样当执行 effect 函数的时候，不会立即执行副作用回调，而是返回一个执行函数（effectFn），只有在后续明确调用 effectFn 时，才会运行这个 effect 函数。这样就实现了惰性执行，在 watch 函数中手动控制用户传入的 effct 副作用函数的执行时机，这样就可以实现 oldValue 和 newValue 的获取，从而传递给用户传入的回调函数 cb，最终实现了 watch 的功能

## 过期的副作用

### 竞态问题

竞态：在描述一个系统或者进程的输出，依赖于不受控制的事件出现的顺序或者出现时机

举例：

```javaScript
   let finalData
   watch(obj, async () => {
    // 发送并等待网络请求
    const res = await fetch('/path/to/request')
    // 将请求结果赋值给 data
    finalData = res
  })
```

<img src="/img/vue/竞态问题.webp" alt="竞态问题"  />

1. 第一次修改 obj 的值的时候触发 watch 回调执行，触发 A 请求
2. 在第一个回调发起的请求的消息体还没回来之前又修改了 obj 的值，这时候又触发了一次 B 请求。到此为止总共有两次请求.
3. 因为 B 请求的响应比较快，所以先回来了，A 可能因为传输问题所以比较慢导致后面才回来，最后在左边那个例子中，赋值给 finalData 的值就是 A 请求的结果，因为 B 请求先回来，被 A 请求这个后来者给覆盖了。这个不是理想的情况，因为 B 请求才是最新的结果，所以这就是竞态问题。

### 解决方式

```javaScript
watch(obj, async (newValue, oldValue, onInvalidate) => {
  // 定义一个标志，表示当前副作用函数是否过期，默认为 false，表示没有过期
  let expired = false
  // 调用 onInvalidate() 函数注册一个过期回调
  onInvalidate(() => {
    // 当过期时，将 expired 设置为 true
    expired = true
  })
  // 发送网络请求
  const res = await fetch('/path/to/request')
  // 只有当该副作用函数的执行没有过期时，才会执行后续操作
  if (!expired) {
    finalData = res
  }
})
```

vue3 在 watch 回调中提供了 onInvalidate 方法允许你注册一个回调函数，当副作用函数需要重新执行时，这个回调就会被调用。

如上例子，当执行到 res = await fetch 的时候，这个时候走网络请求，主线程的控制权从当前协程交给上一层，所以去执行其他的代码，当网络请求完成后 watch 的内部逻辑会调用 onInvalidate，然后继续往下执行

```javaScript
 if (!expired) {
    finalData = res
  }
```

因为 onInvalidate 将 expired 设置为 true，表示当前副作用函数已经过期了，所以不会将结果赋值给 finalData，这样就解决了竞态问题

### onInvalidate 原理

副作用函数(effect)重新执行前，先触发 onInvalidate 函数

原理：每次新的 effect 回调执行之前，都会执行上一个回调函数即过期回调注册的 onInvalidate 函数

```javaScript
/**
 * watch的原理使用了effect函数的情性执行调度器,情性执行实现watch使用的时候不会立即执行副作用函数(即下方的getter),
 * 调度器实现了响应式变量发生变化时,不再是立即触发getter副作用函数的执行,而是触发scheduler的执行,然后再scheduler里
 * 执行用户传入的cb,这样就实现了watch
 * @param source 监听,可以是对象或者函数
 * @param cb 用户传递的callback 监听对象source发生变化的时候触发schduler,执行cb
 */
function watch(source, cb) {
    let getter;
    if (typeof source === "function") { // 如果是函数表示是getter,可以直接赋值
        getter = source;
    } else {
        getter = () => traverse(source)// 包装成effect对应的effectFn,函数内部进行遍历达到依赖收集的目的
    }

    let oldValue, newValue;
    let cleanupFn;//用于存储用户注册的过期回调
    //定义onInvalidate函数
    const onInvalidate = (fn) => {
        //将过期时的回调函数存储到cleanupFn中
        cleanupFn = fn
    }

    const effectFn = effect(
        () => getter(), // 这个就是传递的fn
        // 下面这个是option 开启了lazy惰性执行和scheduler调度器来控制用户传递的第二个属性callback何时执行
        {
            //开启lazy选项,将返回值存储到effectFn中以便于之后手动调用
            lazy: true,
            scheduler() {
                //在调用用户回调函数cb之前,先调用过期的effct回调中注册的onInvalidate函数
                if (cleanupFn) {
                    cleanupFn();
                }
                newValue = effectFn(); // 值变化时再次运行effect函数,获取新值
                cb(newValue, oldValue, onInvalidate);
                //更新旧值,不然下次得到的是错误的旧值
                oldValue = newValue;
            }
        }
    )
    //手动调用副作用函数,拿到的值是旧值
    oldValue = effectFn();
}
```

watch 特点总结：
1. 使用 effect 实现响应式监听
2. 支持监听对象或函数
3. 通过 lazy 和 scheduler 实现延迟执行
4. 提供 cleanupFn 处理过期回调
5. 保存新旧值用于比较
