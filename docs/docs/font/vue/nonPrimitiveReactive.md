# 非原始值的响应式方案

<img src="/img/vue/普通对象响应式思维导图.webp" alt="普通对象响应式思维导图"  />

对于非原始值的响应式方案，我们首先需要了解什么是非原始值。在 JavaScript 中，原始值包括字符串、数字、布尔值、null、undefined 和 symbol，而其他所有值都是非原始值，包括对象和数组。

vue2 使用 Object.defineProperty 实现非原始值的响应式方案：

```javascript
Object.defineProperty(obj, key, {
  get() {
    // 依赖收集
    return value;
  },
  set(newValue) {
    // 触发更新
    value = newValue;
  },
});
```

Vue 2 (Object.defineProperty):
需要递归遍历对象所有属性
不能检测对象属性的添加和删除
不能直接监听数组索引和长度的变化
需要使用 Vue.set() 和 Vue.delete() 来处理动态属性

### Proxy

vue3 使用 Proxy 实现非原始值的响应式方案：

1. 创建一个 Proxy 对象，用于拦截对非原始值的操作。
2. 在 Proxy 对象中，使用 `get` 拦截器来追踪属性的读取操作，并在读取属性时进行依赖收集。
3. 在 Proxy 对象中，使用 `set` 拦截器来追踪属性的赋值操作，并在赋值属性时进行依赖更新。
4. 在 Proxy 对象中，使用 `deleteProperty` 拦截器来追踪属性的删除操作，并在删除属性时进行依赖更新。

```javascript
new Proxy(target, {
  get(target, key) {
    // 依赖收集
    track(target, key);
    return target[key];
  },
  set(target, key, value) {
    // 触发更新
    trigger(target, key);
    target[key] = value;
    return true;
  },
});
```

Proxy 的优势在于它可以直接代理整个对象,它不仅可以拦截对象已有属性的读取和修改，还能够动态地监听新增的属性或者删除的属性。这与 Vue 2 使用 Object.defineProperty 的方式形成鲜明对比，因为 Vue 2 无法直接检测到新增或删除的属性。

### Reflect

作用：用来和 proxy 配合使用

#### 为什么在 Proxy 中需要使用 Reflect?

当在 Proxy 的拦截器（get/set）中使用 this 时会产生问题：

- this 指向当前的 proxy 对象
- 通过 this 读取/设置属性会再次触发当前正在执行的拦截器
- 由于拦截器还未执行完就触发下一次调用，导致无限递归，最终栈溢出

Reflect 提供了解决方案：

- Reflect 提供的方法与 Proxy 的拦截器一一对应
- 在拦截器中使用 Reflect 直接操作原始对象
- 避免触发代理的拦截器，从而防止递归调用

例子：

```javascript
// 目标对象 - 原始数据
const obj = { name: 'test' };

// 错误写法：在代理对象内部通过 this 操作会导致递归调用栈溢出
const proxy1 = new Proxy(obj, {
  get(target, key) {
    // 这里的 this 指向 proxy1 对象本身
    // 通过 this[key] 读取属性时会再次触发当前的 get 拦截器
    // 形成死循环: get -> this[key] -> get -> this[key] -> ...
    return this[key];
  },
  set(target, key, value) {
    // 同理，this[key] = value 会再次触发当前的 set 拦截器
    // 形成死循环: set -> this[key] = value -> set -> this[key] = value -> ...
    this[key] = value;
    return true;
  },
});

// 正确写法：使用 Reflect API 直接操作原始对象,避免递归
const proxy2 = new Proxy(obj, {
  get(target, key) {
    // Reflect.get 会直接在原始对象 target 上读取属性
    // 不会触发代理对象的 get 拦截器,从而避免递归
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    // Reflect.set 会直接在原始对象 target 上设置属性
    // 不会触发代理对象的 set 拦截器,从而避免递归
    return Reflect.set(target, key, value);
  },
});
```

### 对象属性 in 操作的响应式处理

在 JavaScript，当我们使用'w' <span style='color:red'>in</span> obj 这样的语法来检查对象是否包含某个属性时，这也被认为是一种读取操作。 无论是直接通过访问对象属性，还是通过'in'操作符来检查属性是否存在，都被视为读取操作。所以既然是读取操作，那么 in 响应式对象的副作用函数就应该被依赖收集起来。(注：<span style='color:red'>track 收集将副作用函数回调收集进当前 obj 对象的 ITERATE_KEY 属性依赖集合中</span>)

#### proxy 怎么监听 in 操作符的？

proxy 内除了 set 和 get 拦截方法，还有一个 has 方法，只要用户使用了 in 操作符就会触发，所以可以在 has 方法中对副作用函数进行依赖收集 (注意：这个 has 方法只能拦截 in 操作符，不能拦截 for in 遍历的拦截 )

### for in 操作的响应式处理

#### has 方法只能拦截单个属性 in 代理对象，而对于 for in 操作是拦截不了的 ，如何拦截 for in 操作？

proxy 实例对象中除了 get 、set 、 has 之外还有 <span style='color:red'>ownsKeys</span> 拦截方法，这个方法会在 for in 响应式对象遍历操作之前执行，将进行 for in 操作的副作用回调函数进行 track 依赖收集(注意：<span style='color:red'>ownsKeys 拦截触发是在 for in 操作之前，而且只执行一次，track 收集将副作用函数回调收集进当前 obj 对象的 ITERATE_KEY 属性依赖集合中</span>)

```javascript
const proxy = new Proxy(target, {
  // 在以上操作执行前触发
  ownKeys(target) {
    // 收集依赖到 ITERATE_KEY
    track(target, ITERATE_KEY);
    return Reflect.ownKeys(target);
  },
});

for (const key in proxy) {
  console.log(key);
}
```

#### 哪些操作会触发通过 for...in 收集的副作用函数重新执行？

当某个操作改变了 for...in 的遍历结果时，需要重新执行它收集的副作用函数。例如，新增或删除对象的属性会影响 for...in 的结果，因此需要触发对应的副作用回调重新执行。

举例：

```javascript
const proxy = reactive({
  oldKey: 'old value', // 假设这是响应式的键值对
});

effect(() => {
  for (const key in proxy) {
    console.log('Key:', key);
  }
});

// 修改已有属性，不影响键集合
proxy.oldKey = 'new value';
// 不会触发for in操作收集的ITERATE_KEY集合中的副作用函数

// 删除属性，键集合发生变化
delete proxy.oldKey;
// 会触发for in操作收集的ITERATE_KEY集合中的副作用函数

// 新增属性，键集合发生变化
proxy.existingKey = 'new value';
// 会触发for in操作收集的ITERATE_KEY集合中的副作用函数
```

- 修改 oldKey 的值不会触发 for in 操作收集的 ITERATE_KEY 集合中的副作用函数，因为 oldKey 是响应式的键值对。
- 删除 oldKey 属性会触发 for in 操作收集的 ITERATE_KEY 集合中的副作用函数，因为删除属性会改变键集合。
- 新增 existingKey 属性也会触发 for in 操作收集的 ITERATE_KEY 集合中的副作用函数，因为新增属性会改变键集合。

```javascript
/**
 * 创建响应式对象
 */
function reactive(target) {
  return new Proxy(target, {
    // 拦截属性读取，收集依赖
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    // 拦截属性设置，触发依赖
    set(target, key, newValue, receiver) {
      // 判断是新增属性还是修改属性
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const oldValue = target[key];
      const result = Reflect.set(target, key, newValue, receiver);
      if (!hadKey) {
        // 新增属性
        trigger(target, key, 'ADD');
      } else if (oldValue !== newValue) {
        // 修改属性
        trigger(target, key, 'SET');
      }
      return result;
    },
    // 拦截属性删除，触发依赖
    deleteProperty(target, key) {
      // 判断属性是否存在
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const result = Reflect.deleteProperty(target, key);
      if (hadKey && result) {
        // 删除成功，触发依赖
        trigger(target, key, 'DELETE');
      }
      return result;
    },
    // 拦截 for...in 等操作
    ownKeys(target) {
      // 收集 ITERATE_KEY 依赖
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    // 拦截 in 操作
    has(target, key) {
      track(target, key); // 为 key 的存在性收集依赖
      return Reflect.has(target, key); // 返回 key 是否存在
    },
  });
}

/**
 * 触发依赖
 * @param {Object} target 目标对象
 * @param {string} key 属性键
 * @param {string} type 操作类型：'ADD'|'DELETE'|'SET'
 */
function trigger(target, key, type) {
  // 获取目标对象的依赖映射
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 获取需要触发的副作用函数集合
  const effects = new Set();

  // 添加与具体 key 相关的副作用函数
  const deps = depsMap.get(key);
  if (deps) {
    deps.forEach((effect) => effects.add(effect));
  }

  // 当操作类型为 ADD 或 DELETE 时，需要触发 ITERATE_KEY 相关的副作用
  // 因为这些操作会影响 for...in 的遍历结果
  if (type === 'ADD' || type === 'DELETE') {
    const iterateEffects = depsMap.get(ITERATE_KEY);
    if (iterateEffects) {
      iterateEffects.forEach((effect) => effects.add(effect));
    }
  }

  // 执行收集到的所有副作用函数
  effects.forEach((effect) => effect());
}
```

如上例子中，当删除、新增的时候会将'DELETE'和'ADD'传递给 trigger 函数，trigger 函数会根据不同的操作类型执行不同的操作。trigger 函数会判断到是否是新增或删除操作，如果是则还需要将 响应式对象的 ITERATE_KEY 属性相关的副作用函数也执行一遍。

### 避免原型链访问导致的重复副作用执行

场景：读取一个响应式对象的属性，这个属性不存在于当前对象上，而存在于当前对象的原型对象上，比如在 effect 副作用函数中读取响应式对象 obj.a，这时候会触发 obj.a 的读取和 obj 原型对象上的读取，这个时候当前的副作用函数会被 obj.a 和 obj 原型对象的 a 属性依赖集合所收集，当我们触发 obj.a = 3 设置一个值的时候，也会触发 obj 对象上的属性赋值和原型对象上的赋值，这样会触发刚刚收集的依赖，导致 effect 执行两次，这是我么不想出现的情况，我们只想触发一遍，如何处理？

```javascript
// 实例化响应式对象和原型链
const proto = reactive({ a: 1 }); // 原型对象
const obj = reactive(Object.create(proto)); // 当前对象

// 定义一个 effect
effect(() => {
  console.log('effect triggered: obj.a =', obj.a);
});

// 第一次获取 obj.a，会触发以下行为：
// 1. obj.a 不存在（触发 obj 的 get，但是未命中）
// 2. 进入原型链，访问 proto.a，proto 的 get 被触发
// 3. 因此当前 effect 被 obj.a 和 proto.a 的依赖集合同时收集

console.log('当前 obj 的初始状态：', obj);

// 更新 obj.a 就会触发obj.a 和 proto.a 设置操作，所以会触发 effect 两次
obj.a = 3;
```

#### 解决办法

```javascript
function reactive(obj) {
  return new Proxy(obj, {
    set(target, key, newVal, receiver) {
      const oldVal = target[key];
      // 判断是添加新属性还是设置已有属性
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? 'SET'
        : 'ADD';
      const res = Reflect.set(target, key, newVal, receiver);

      // 关键判断：确保当前 receiver 是 target 的代理对象
      if (target === receiver.raw) {
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
          trigger(target, key, type);
        }
      }
      return res;
    },
    // 省略其他拦截函数
  });
}
```

在 set(target, key, newVal, receiver) 方法中，target 始终是被代理的目标对象，而 receiver 是当前触发操作的代理对象。receiver.raw 可以获取到触发操作的代理对象的原始对象，通过判断 target === receiver.raw，可以确保当前操作直接作用于代理对象本身，而不是通过原型链或其他间接方式触发的。这样可以确保属性的设置操作只针对目标对象自身，而不会因为原型链或其他代理对象的影响误触发响应逻辑。

### 浅响应实现原理

当我们通过 proxy 对象获取某个属性时，如果这个属性是个对象的情况下，会默认用 reactive 包装一层，但是如果是通过 shallowReativity 方法，那么就直接返回值就好，不需要再用 reactive 套一层，这就是浅响应的原理。

在 Vue 3 中，使用 reactive API 创建的对象，无论有多少层嵌套，所有内部对象都会在访问时动态代理，而不会在对象创建时直接触发代理操作。

```javascript
/**
 * 创建一个响应式对象
 *
 * @param obj 需要被创建为响应式对象的原始对象
 * @param isShallow 是否为浅响应式对象，默认为 false
 * @param readonly 是否为只读对象，默认为 false
 * @returns 返回响应式对象
 */
function createReactive(obj, isShallow = false, readonly = false) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') {
        return target;
      }
      // 非只读的时候才需要建立响应联系
      if (!isReadonly) {
        track(target, key);
      }

      const res = Reflect.get(target, key, receiver);
      //如果是浅响应，则直接返回原始值
      if (isShallow) {
        return res;
      }
      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
  });
}
```

### readonly 只读属性的原理

如果是只读属性，那么在访问时，就不需要进行依赖收集，因为只读属性不能被修改，所以不需要进行依赖收集。

```javascript
 function readonly(obj) {￼
   return createReactive(obj, false, true /* 只读 */)￼
 }
```

如果使用的是 isReadonly 方法，那么下面的 createReactive 方法中的 isReadonly 入参就是 true

```javascript
/**
 * 创建一个响应式对象
 * @param {Object|Array} target 需要转换为响应式的对象
 * @param {boolean} [isShallow=false] 是否为浅响应式
 * @param {boolean} [isReadonly=false] 是否为只读模式
 * @returns {Proxy} 返回代理后的响应式对象
 * @throws {TypeError} 当传入的target不是对象时抛出错误
 */
function createReactive(target, isShallow = false, isReadonly = false) {
  // 参数校验
  if (!target || typeof target !== 'object') {
    throw new TypeError('Target must be an object');
  }

  // 检查对象是否已经被代理
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      // 如果是只读属性，那么就不进行依赖收集
      if (!isReadonly) {
        track(target, key);
      }
      const res = Reflect.get(target, key, receiver);
      // 浅响应直接返回原始值
      if (isShallow) {
        return res;
      }
      // 深响应则需要递归代理
      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res);
      }

      return res;
    },

    set(target, key, newVal, receiver) {
      // 如果为只读属性，则不允许修改
      if (isReadonly) {
        console.warn(`属性 "${key}" 是只读的`);
        return true;
      }
      const oldVal = target[key];
      // 数组特殊处理
      const hadKey = Array.isArray(target)
        ? Number(key) < target.length
        : Object.prototype.hasOwnProperty.call(target, key);

      const result = Reflect.set(target, key, newVal, receiver);

      if (result) {
        // 只有当值真正发生变化时才触发更新
        if (!hadKey) {
          trigger(target, key, 'ADD');
        } else if (hasChanged(oldVal, newVal)) {
          trigger(target, key, 'SET');
        }
      }

      return result;
    },

    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`属性 "${key}" 是只读的`);
        return true;
      }

      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const result = Reflect.deleteProperty(target, key);

      if (result && hadKey) {
        trigger(target, key, 'DELETE');
      }

      return result;
    },

    // 拦截 Object.keys 等操作
    ownKeys(target) {
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },

    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
  });

  proxyMap.set(target, proxy);

  return proxy;
}

// 工具函数：检查值是否发生变化
function hasChanged(value, oldValue) {
  return !Object.is(value, oldValue);
}

// 用于存储已创建的代理对象
const proxyMap = new WeakMap();

// Symbol key for iteration
const ITERATE_KEY = Symbol('iterate');
```

## Set 和 Map 的代理

<img src="/img/vue/Set和Map响应式处理思维导图.webp" alt="Set和Map响应式处理思维导图"  />

由于 set 集合和 map 的读取和普通对象有所不同，普通对象直接通过 obj.x 读取或者 obj['x']，但是 set 集合和 map 通过 get、add 方法和 set 方法来进行读写，所以 vue3 在处理集合和 map 的响应式的时候需要额外多做点工作

set 集合的 size 属性就不能通过代理对象去读取，不然会报错，根本原因是 Set.prototype.size 的 getter 校验 this 是合法的 Set 对象，而代理对象没有原始的内部插槽 [[SetData]]，所以在通过代理访问时会报错，解决的关键是确保 getter 的 this 指向原始的 Set。

结论：proxy 代理 set 后的对象不再被 js 引擎认为是真正的 set 实例，要通过代理对象读取 set 集合的 size 属性，那么就需要确保操作时用的是原始 set 对象（map 同理）。

```javascript
const set = new Set();
const proxy = new Proxy(set, {
  get(target, prop, receiver) {
    // 第三个参数是读取时的this，这里我们用原始的set对象，而不是当前操作的代理对象receiver
    return Reflect.get(target, prop, target);
  },
});
```

上面代码中，我们通过 改变读取对象 this 指向 target 即原始的 set 对象，就可以正常读取 set 属性了。

当操作 Set 的方法时（如 add、delete、has）等也是不能通过 proxy 对象来进行操作，也要原始 set 集合进行操作才可以，所以需要在操作 set 集合方法的时候将集合的方法绑定 this 为原始集合，这样就不会报错了

```javascript
get(target, key, receiver) {
  // 处理 size 属性
  if (key === 'size') {
    return Reflect.get(target, key, target)
  }

  // 处理 Set 的方法  target[key]是set的方法
  return target[key].bind(target)
}
```

在 Vue 3 的源码中，mutableInstrumentations 对象专门用于封装对集合类型（如 Set、Map、WeakSet 和 WeakMap）的代理方法。这些方法被 Vue 3 的响应式系统用来拦截集合的常规操作（如添加、删除、获取等），以便实现以下两点核心功能：

- 依赖追踪（track）：在访问集合数据时，收集依赖（即哪些响应式函数或组件使用了该数据）。
- 触发响应更新（trigger）：当集合发生变化时，通知对应的依赖重新运行或更新。

```javascript
// 定义集合类型的自定义方法
const mutableInstrumentations = {
  // Set 的 add 方法
  add(key) {
    const target = this.raw;
    // 检查值是否已经存在
    const hadKey = target.has(key);
    // 通过原始数据对象执行 add 方法
    const res = target.add(key);
    // 只有在值不存在的情况下才触发响应
    if (!hadKey) {
      trigger(target, key, 'ADD');
    }
    return res;
  },
  // Set 的 delete 方法
  delete(key) {
    const target = this.raw;
    // 检查值是否存在
    const hadKey = target.has(key);
    const res = target.delete(key);
    // 只有在值存在的情况下才触发响应
    if (hadKey) {
      trigger(target, key, 'DELETE');
    }
    return res;
  },

  // Set 的 size 属性
  get size() {
    const target = this.raw;
    // size 操作需要追踪依赖
    track(target, ITERATE_KEY);
    return target.size;
  },
};

/**
 * 创建代理对象，用于响应式处理
 *
 * @param {Object} obj - 要代理的对象
 * @param {boolean} isReadonly - 是否为只读模式
 * @param {boolean} isShallow - 是否为浅响应
 * @returns {Proxy} - 返回代理对象
 */
function createReactive(obj, isShallow = false, isReadonly = false) {
  // 判断是否为集合类型
  const targetIsCollection = obj instanceof Set || obj instanceof Map;

  return new Proxy(obj, {
    get(target, key, receiver) {
      // 获取原始数据对象
      if (key === 'raw') {
        return target;
      }
      // 处理集合类型的方法
      if (targetIsCollection && mutableInstrumentations.hasOwnProperty(key)) {
        return mutableInstrumentations[key];
      }
      // 普通对象的处理逻辑
      const res = Reflect.get(target, key, receiver);
      // 依赖收集
      if (!isReadonly) {
        track(target, key);
      }
      // 浅响应直接返回
      if (isShallow) {
        return res;
      }
      // 处理嵌套对象
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
  });
}
```

小结：代理 Set 时需要将 size 属性和操作方法(add/delete/has 等)都指向原始 Set 对象，这样才能正确读取 size 和执行方法操作。

### 避免数据污染

为了避免数据污染，当我们操作 Proxy 代理的 Map 或 Set 集合时，需要特别注意：添加到集合中的数据应该是原始对象，而不是响应式对象。这是因为代理对象本质上操作的是原始对象。如果我们将响应式对象添加到代理对象 map 中，当直接操作原始对象 map 时，可能会因为其中某个属性是响应式对象而触发依赖集合中的副作用函数执行，导致意外的行为。

因此，在触发 Set 或 Map 的代理对象的添加方法时，需要确保添加的数据是原始对象，而不是响应式数据。这样可以避免因响应式对象的嵌套关系导致的副作用函数误触发，从而保证数据的纯净性和系统的稳定性。

```javascript
// 自定义 Set 的 add 方法
const mutableInstrumentations = {
  // set的add方法
  add(value) {
    const target = this.raw;
    const rawKey = toRaw(value); // 转换为原始对象
    const hadKey = target.has(rawKey);
    const res = target.add(rawKey);
    if (!hadKey) {
      trigger(target, rawKey, 'ADD'); // 触发响应
    }
    return res;
  },
  // map的set方法
  set(key, value) {
    const target = this.raw;
    const rawKey = toRaw(key); // 转换 key 为原始对象
    const rawValue = toRaw(value); // 转换 value 为原始对象
    const hadKey = target.has(rawKey);
    const oldValue = target.get(rawKey);
    const res = target.set(rawKey, rawValue); // 存储原始对象

    // 触发响应
    if (!hadKey) {
      trigger(target, rawKey, 'ADD'); // 如果是新增 key，触发 ADD 类型的响应
    } else if (oldValue !== rawValue) {
      trigger(target, rawKey, 'SET'); // 如果是更新 value，触发 SET 类型的响应
    }
    return res;
  },
};
```

以上代码中，我们通过 toRaw 方法将添加到 Set 或 Map 中的数据转换为原始对象，从而避免因响应式对象的嵌套关系导致的副作用函数误触发。

## 数组的代理

<img src="/img/vue/数组的响应式处理.webp" alt="数组的响应式处理"  />

数组虽然有很多操作方法，但是本质上和普通对象很接近，不像 set 和 map，大部分用来代理常规对象的方式对于数组也是生效的

过数组下标读取数组元素和设置都可以触发 proxy 的 get 和 set 方法。

- Vue 2：由于基于 Object.defineProperty，无法完全代理数组的操作，必须通过 Vue.set 或使用数组的重写方法（如 push、splice）来触发视图更新。
- Vue 3：基于 Proxy，可以完全代理数组的所有操作，响应式系统更加完善

### 数组长度减少

当操作数组导致长度发生变化时，原数组中索引大于或等于新长度的元素（即将被删除的元素），其对应的依赖集合中的副作用函数都会被触发。

```javascript
const arr = reactive([1, 2, 3, 4, 5]) // 长度为 5


effect(() => console.log(arr[3])) // 会触发，因为 3 >= 新长度
effect(() => console.log(arr[4])) // 会触发，因为 4 >= 新长度
effect(() => console.log(arr[2])) // 不会触发，因为 2 < 新长度

/*
当 arr.length = 3 时：
[1, 2, 3, 4, 5] -> [1, 2, 3]
          ↑  ↑
 这些位置(索引3,4)的依赖会被触发，因为它们 >= 新长度(3)
*/

当 arr.length = 3

```

### 数组长度增加

1. 纯粹增加长度：只触发 length 依赖
2. 给新位置赋值：触发 length 依赖 + 被赋值位置的依赖

```javascript
const arr = reactive([1, 2, 3]); // 初始长度为 3

// 设置依赖
effect(() => console.log('length:', arr.length));
effect(() => {
  // 这里读取 arr[4] 会建立依赖关系
  console.log('index 4:', arr[4]);
});

// 给新位置赋值
console.log('\n--- 设置 arr[4] = 5 ---');
arr[4] = 5;
// 输出:
// length: 5    (长度变化触发)
// index 4: 5   (新位置赋值触发)
```

当执行 arr[4] = 5 时的完整过程：

1. 读取 arr[4]

   - 收集依赖，建立 arr[4] 的依赖集合

2. 赋值操作导致长度变化 (3 -> 5)

   - 触发 length 的依赖集合

3. 设置新值 5
   - 触发 arr[4] 的依赖集合

大致源码如下：

```javascript
function createReactiveObject(target) {
  const proxy = new Proxy(target, {
    // get(...) {
    //  ...
    // },
    set(target, key, value, receiver) {
      const oldLength = target.length;
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);

      // 是数组的情况下
      if (Array.isArray(target)) {
        const index = Number(key);
        // 如果 key 是 length
        if (key === 'length') {
          if (value < oldLength) {
            for (let i = value; i < oldLength; i++) {
              trigger(target, 'delete', i.toString());
            }
          }
          trigger(target, 'set', 'length');
        }
        // 如果 key 是索引
        else if (!isNaN(index)) {
          // 如果 key 大于等于 length
          if (index >= oldLength) {
            trigger(target, 'set', 'length');
          }
          // 如果旧值不等于新值
          if (oldValue !== value) {
            trigger(target, 'set', key);
          }
        }
      }
      return result;
    },
  });
  return proxy;
}
```

### for...of 遍历的依赖收集机制

for of 遍历响应式数组，不用对数组的代理作过多的处理，因为数组中有迭代器，会读取响应式数组的属性和 length 属性，所以执行 for of 的 effect 回调会被属性和 length 依赖集合所收集，但有一个注意点就是 for of 遍历的时候读取数组的 Symbol.iterator 属性，这个时候要避免 Symbol.iterator 属性依赖集合收集这个 effect，因为不需要收集，以免造成不必要的影响。

详解：

- 在 effect 函数中遍历响应式数组，那么这个 effect 函数会被收集到数组的 length 属性的依赖列表和数组中对应的索引依赖集合中，因为 for of 遍历的时候，内部的迭代器需要知道何时停止迭代，这是通过检查索引是否超过数组长度来决定的，所以会读取当前索引和数组的长度，这样一来，当前的 effect 回调就会被收集所有的索引依赖集合和 length 依赖集合中。 因此，修改数组的长度或者修改数组的某个索引对应的值时，所有收集到这些依赖集合中的 effect 函数都会被重新执行。
- 只要数组的长度和元素值发生改变，副作用函数自然会重新执行。
- 无论是使用 for...of 循环，还是调用 values 等方法，都会读取数组的 Symbol.iterator 属性。该属性是一个 symbol 值，为了避免发生意外的错误，以及性能上的考虑，我们不应该在副作用函数与 Symbol.iterator 这类 symbol 值之间建立响应联系，因此需要修改 get 拦截函数，如以下代码所示：

```javascript
  function createReactive(obj, isShallow = false, isReadonly = false) {￼
      return new Proxy(obj, {￼
            // 拦截读取操作￼
           get(target, key, receiver) {￼
                 console.log('get: ', key)￼
                 if (key === 'raw') {￼
                    return target￼
                  }￼
           // 添加判断，如果 key 的类型是 symbol，则不进行追踪￼
          if (!isReadonly && typeof key !== 'symbol') {￼
               track(target, key)￼
           }
          const res = Reflect.get(target, key, receiver)
           if (isShallow) {
              return res￼
            }￼
         if (typeof res === 'object' && res !== null) {￼
             return isReadonly ? readonly(res) : reactive(res)￼
           }￼
           return res￼
        },￼
       })￼
     }
```

在调用 track 函数进行追踪之前，需要添加一个判断条件，即只有当 key 的类型不是 symbol 时才进行追踪，这样就避免了上述问题。

### 数组的方法 includes

includes 方法的核心逻辑是：

1. 遍历数组的每个索引。
2. 比较每个索引的值与传入的值是否相等（使用严格相等 === 比较）。
3. 如果找到匹配的值，则返回 true，否则返回 false。

在 Vue 3 中，reactive 方法会为非原始值（如对象和数组）创建代理对象。当访问数组的元素时，返回的值是代理对象，而不是原始对象。

```javascript
    function createReactive(res){
        if (typeof res === 'object' && res !== null) {￼
            // 如果值可以被代理，则返回代理对象￼
           return isReadonly ? readonly(res) : reactive(res)￼
       }
    }

    function reactive(obj) {￼
       // 每次调用 reactive 时，都会创建新的代理对象￼
         return createReactive(obj)￼
    }
   即使参数 obj 是相同的，每次调用 reactive 函数时，也都会创建新的代理对象
```

```javascript
const obj = {};
const arr = reactive([obj]);
console.log(arr[0] === obj); // false，因为 arr[0] 是 obj 的代理对象
```

因此，当调用 includes 方法时，includes 会尝试匹配数组中的值，但由于数组中的元素是代理对象，而传入的值是原始对象，导致匹配失败。
为了解决这个问题，我们需要在 includes 方法中比较代理对象和原始对象是否相等。具体实现如下：

```javascript
console.log(arr.includes(obj)); // false，因为 obj 是原始对象，而 arr[0] 是代理对象
```

解决： 定义一个 Map 实例，存储原始对象到代理对象的映射

```javascript
const reactiveMap = new Map()￼
  function reactive(obj) {￼
   // 优先通过原始对象 obj 寻找之前创建的代理对象，如果找到了，直接返回已有的代理对象￼
     const existionProxy = reactiveMap.get(obj)￼
     if (existionProxy) return existionProxy￼
      // 否则，创建新的代理对象￼
     const proxy = createReactive(obj)￼
      // 存储到 Map 中，从而避免重复创建￼
     reactiveMap.set(obj, proxy)￼
     return proxy￼
 }
```

这样，以后对一个对象创建成 proxy 代理对象就是唯一的了，如果已经创建过了就直接在 reactiveMap 中拿，这样就对一个对象重复创建 proxy 导致不必要的问题出现，如上述问题

#### 为什么要重写数组的方法？比如 include

重写数组方法（如 includes）的原因在于，当一个原始对象被 Proxy 代理后，读取其中的属性会被响应式包裹。此时，如果调用 includes 方法去判断一个原始对象的属性是否存在于代理对象中，会返回 false，因为代理对象和原始对象的引用地址已经不同。

虽然可以在 Proxy 的 get 方法中通过 this.raw 来获取原始对象并进行对比，但这种方式灵活性不足，且需要手动处理每种情况。相比之下，直接重写 includes 方法，通过复用原生 includes 方法并在其中加入对代理和原始对象的处理逻辑，不仅能解决问题，还能保持代码的扩展性和可维护性。

```javascript
// Vue 3 的响应式系统实现
function createReactiveObject(target) {
  const proxy = new Proxy(target, {
    get(target, key，receiver) {
      // 特殊处理 __v_raw 属性
      if (key === '__v_raw') {
        return target;
      }

      // 重写数组方法
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }


      return Reflect.get(target, key);
    }
  });

  // 保存原始对象的引用
  def(proxy, '__v_raw', target);

  return proxy;
}
```

重写的数组方法都在 arrayInstrumentations 对象中

```javascript
const arrayInstrumentations = {};

// 重写 includes 方法
['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    const arr = toRaw(this); // 获取原始数组
    for (let i = 0, l = this.length; i < l; i++) {
      // 依赖收集
      track(arr, TrackOpTypes.GET, i + '');
    }
    // 如果传入的是代理对象，获取其原始值
    const res = arr[method](...args);
    if (res === -1 || res === false) {
      // 如果找不到，尝试用原始值再查找一次
      return arr[method](...args.map(toRaw));
    } else {
      return res;
    }
  };
});

// 重写变更方法
['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    pauseTracking(); // 暂停依赖收集
    const res = toRaw(this)[method].apply(this, args); // 调用原始数组方法
    resetTracking(); // 恢复依赖收集
    return res;
  };
});

// 处理 slice 和 concat 等方法
['slice', 'concat'].forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    const arr = toRaw(this); // 获取原始数组
    for (let i = 0, l = this.length; i < l; i++) {
      // 依赖收集
      track(arr, TrackOpTypes.GET, i + '');
    }
    return arr[method](...args).map(wrap); // 返回代理后的结果
  };
});
```

### 隐式修改数组长度的原型方法

在 Vue 3 的响应式系统中，数组的某些方法（如 push、pop、shift、unshift 和 splice）会隐式修改数组的长度（length 属性）。这些方法在代理对象中触发时，会先后触发 get 和 set 拦截器，分别针对当前操作的索引和 length 属性。这种行为可能导致依赖收集和触发机制出现问题，尤其是在多个 effect 中同时使用这些方法时，可能会引发死循环，最终导致栈溢出。

```javascript
const arr = reactive([]);

// 第一个副作用函数
effect(() => {
  arr.push(1);
});

// 第二个副作用函数
effect(() => {
  arr.push(1);
});
```

push 特性：首先读取 arr 的长度，从而确定数组要加到哪个索引位置上，比如长度是 1，那么新元素要添加到索引为 1 上，即 arr[1] = 新元素，这个过程先读取索引为 1，再设置，所以整个过程触发两次 get 和两次 set，分别是读取 length 和索引 1，设置 length 和索引 1 的值

解析：

第一个 effect 执行的时候，触发 arr 代理对象触发 push 方法，此时要将元素 1 添加的索引为 0 的位置，所以索引为 0 的属性依赖集合将当前这个 effect 副作用函数收集起来，然后再将 effect 副作用函数也收集进 arr 代理对象的 length 属性依赖集合中，因为先后读取了对应的索引和 length 属性；设置完之后进行触发，因为触发了 set 拦截方法，但是因为当前的 effect 回调正在执行，所以触发依赖过滤掉当前副作用回调，所以到此为止没问题；

但是当我们执行第二个 effect 的时候就出现问题了，第二个 efffect 回调也执行 arr 代理对象的 push 方法，一样先后触发了索引属性和 length 属性的读取，然后收集对应的依赖，到这里 get 方法执行完，这个时候代理对象 arr 的依赖集合有 3 个，分别是两个索引依赖集合(索引 0 和 1)和一个 length 依赖集合，其中 length 依赖集合中有第一个 effect 副作用回调和第二个 effect 副作用回调，所以此时触发 set 方法设置索引和 length，触发索引为 1 的依赖集合和 length 属性依赖集合，因为此时索引为 1 的依赖集合中的 effect 时当前正在执行的(还没执行完)，所以过滤掉，但是触发 length 属性依赖集合的时候，里面有第一个 effect 回调和当前的 effect 回调，所以过滤掉当前的 effect 回调，执行第一个回调，这样当前的回调还没执行完又执行第一个回调，当触发第一个回调的时候又过滤掉第一个回调只触发第二个 effect,又进行压栈，这样循环往复就会导致栈溢出。

所以为了避免这个问题，Vue 3 对 push 方法进行了重写，以避免在读取值的阶段收集 length 的依赖。这种重写的方式使得在执行 push 方法时，只会让对应的索引依赖集合进行收集依赖，而不会收集 length 的依赖。这样的设计是为了避免在多个 effect 中同时使用 push 方法时出现死循环的情况(不然多个 effect 使用 push 的话，都进行 length 收集，就会出现当前 effect 回调刚收集进当前数组的 length 依赖集合中，又触发之前的 length 回调，因为 push 会设置更新数组长度，这样当前 effect 回调还没执行完又去执行刚刚收集的回调，然后就互相循环调用，直到栈溢出)

解决： 因为在调用 push 等方法的同时会读取 length 属性，那么我们就处理成当 push 方法执行的时候不进行其他的依赖收集，这样就不会将当前的 effect 收集成 length 依赖集合中了，其实就是在代理数组对象使用 push 等方法的时候屏蔽 length 属性的依赖收集

```javascript
// 当前是否可以收集
let shouldTrack = true;
// 重写数组的 push、pop、shift、unshift 以及 splice 方法
['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function (...args) {
    shouldTrack = false;
    let res = originMethod.apply(this, args);
    shouldTrack = true;
    return res;
  };
});
```

- 除了 push 方法之外，pop、shift、unshift 以及 splice 等方法都需要做类似的处理

小结：Vue 3 对数组的响应式处理中，像 push、pop 等方法会触发依赖更新，但不会对 length 进行依赖收集（这些方法会隐式访问 length 属性），而直接访问（显式访问）或修改 length 时会正常收集和触发依赖，这种设计避免了重复依赖收集，提升了性能，同时保证了响应式的正确性。
