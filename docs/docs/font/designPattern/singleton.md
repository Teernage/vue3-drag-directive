# 单例模式

## 什么是单例模式？

单例模式（Singleton Pattern）是一种非常经典且常用的设计模式。它的核心思想是确保一个类只有一个实例，并提供一个全局访问点，本质就是用一个变量来存储实例

## 单例模式的实现原理

单例模式的实现通常包括以下几个核心步骤：

1. 将构造函数设为私有（private），禁止外部通过 new 关键字直接创建实例。
2. 在类内部创建一个私有的静态实例（instance），并提供一个公共的静态方法（一般命名为 getInstance）。
3. 当首次调用 getInstance() 时，如果实例不存在就创建并赋值给静态属性；如果已存在，则直接返回。

## 核心实现

```typescript
class Modal {
  private static instance: Modal;

  /**
   * 私有构造函数，禁止外部直接实例化
   */
  private constructor() {
    console.log('Modal 实例已创建');
  }

  public static getInstance(): Modal {
    if (!Modal.instance) {
      Modal.instance = new Modal();
    }
    return Modal.instance;
  }

  public show(): void {
    console.log('显示 Modal');
  }

  public hide(): void {
    console.log('隐藏 Modal');
  }
}
```

---

## 使用示例 1

### 模态框管理器

#### HTML 结构

```html
<div id="modal" style="display: none;">
  <p>这是一个 Modal</p>
  <button id="closeModal">关闭</button>
</div>
<button id="openModal">打开 Modal</button>
```

#### 初始化和使用

```typescript
document.getElementById('openModal')?.addEventListener('click', () => {
  const modal = Modal.getInstance();
  modal.show();
});

document.getElementById('closeModal')?.addEventListener('click', () => {
  const modal = Modal.getInstance();
  modal.hide();
});
```

---

## 使用示例 2

### 全局状态管理

```typescript
class Store {
  private static instance: Store;
  private state: Map<string, any>;

  private constructor() {
    this.state = new Map();
  }

  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  public setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  public getState(key: string): any {
    return this.state.get(key);
  }
}
```

## 总结

单例模式在实际开发中非常有用，尤其是在需要全局共享资源的场景中，例如配置管理器、状态管理仓库等
