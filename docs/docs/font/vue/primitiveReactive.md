# 原始值的响应式处理方案

<img src="/img/vue/初始值响应式方案思维导图.webp" alt="初始值响应式方案思维导图"  width=750 />

### JavaScript 中的原始值

- 原始值指的是 Boolean、Number、BigInt、String、Symbol、undefined 和 null 等类型的值，即非对象类型

- JavaScript 中的 Proxy 无法提供对原始值的代理，因此想要将原始值变成响应式数据，就必须对其做一层包裹，即 ref。

### RefImpl

- Vue 源码中，ref 返回的是一个 RefImpl 类的实例。
- 实例化 Reflmpl 类的时候执行构造函数判断当前数据是对象还是基本数据类型，对象的话用 reactive 包裹，再赋值给\_value 属性，基本数据类型就直接赋值给\_value 属性 有一个只读属性\_\_v_isRef 如果为 true 表示其是 ref 对象 同时 value 属性是以 Reflmpl 类的 get value 和 set value 方法的形式定义的。
- 当读取 ref 对象.value 的时候执行实例的 get value 方法，进行 track 依赖收集，然后返回实例属性\_value 值,同时 Reflmpl 实例有一个 dep 属性，这个属性是一个 Set 集合，用来存储读取 ref 对象(常规数据类型)的不同的 effect 回调，如果是 ref(响应式对象，那么存储的是在对象下的属性依赖集合中) var r ＝ ref(5) 当执行 r.value ＝ 666 的时候，触发 ref 实例的 set value 方法，在 set value 方法中执行 trigger，trigger 从当前 ref 实例的 dep 属性依赖集合中获取所有的 effect 回调进行执行

```javascript
class RefImpl {
  private _rawValue: any;
  private _value: any;
  public dep;
  public __v_isRef = true;

  constructor(value) {
    this._rawValue = value;
    // 看看value 是不是一个对象，如果是一个对象的话
    // 那么需要用 reactive 包裹一下
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = createDep();
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 当新的值不等于老的值的话，
    // 那么才需要触发依赖
    if (hasChanged(newValue, this._rawValue)) {
      // 更新值
      this._value = convert(newValue);
      this._rawValue = newValue;
      // 触发依赖
      triggerRefValue(this);
    }
  }
}
```

### vue 模版使用 ref 对象为什么不用.value？

因为作了一层代理，setup 中返回一个对象，这个对象会被一个 proxy 代理，当模版读取这个对象中的属性的时候，会进入 get 拦截，如果这个属性是 ref 对象，那么会直接返回 ref 对象.value，这就是 proxyRefs 的功能

```javaScript
function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      // 自动脱 ref 实现：如果读取的值是 ref，则返回它的 value 属性值
      return value.__v_isRef ? value.value : value;
    },
  });
}
```

- 在编写 Vue.js 组件时，组件中的 setup 函数所返回的数据会传递给 proxyRefs 函数进行处理
- 读取属性的值有自动脱 ref 的能力，对应地，设置属性的值也应该有自动为 ref 设置值的能力

```javaScript
 newObj.foo = 100 // 应该生效实现此功能很简单，只需要添加对应的 set 拦截函数即可：
 function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver)
        return value.__v_isRef ? value.value : value
     },
        set(target, key, newValue, receiver) {
          // 通过 target 读取真实值
         const value = target[key]
           // 如果值是 Ref，则设置其对应的 value 属性值
         if (value.__v_isRef) {
          value.value = newValue
              return true
          }
        return Reflect.set(target, key, newValue, receiver)
      }
    })
   }
```

这个不需要.value 设置的场景：

```vue
<template>
  <div>{{ foo }}</div>
  <button @click="foo = 100">Set Foo</button>
</template>
```

- 我们讲解了自动脱 ref 的能力。为了减轻用户的心智负担，我们自动对暴露到模板中的响应式数据进行脱 ref 处理。这样，用户在模板中使用响应式数据时，就无须关心一个值是不是 ref 了

总结：在 Vue 中，为了解决 JavaScript 原始值无法直接实现响应式的问题，Vue 引入了 ref 对象，这是一种对原始值和非原始值（如对象）进行响应式处理的包装方案。RefImpl 类是其核心实现，通过 get 和 set 方法收集依赖、触发更新，并对对象类型进行 reactive 包裹。同时，为了增强模板和用户操作时的便利性，Vue 通过 proxyRefs 方法对 setup 返回的数据进行代理，实现了自动脱 ref 的能力：模板和代码中可以直接使用 ref 的值而无需显式访问 .value；此外，更新模板中的值也会自动为 ref 对象设置其 .value，简化了使用和心智负担，提升了开发体验。
