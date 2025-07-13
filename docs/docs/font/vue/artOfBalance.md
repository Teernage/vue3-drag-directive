# 权衡的艺术

<img src="/img/vue/权衡的艺术.webp" alt="权衡的艺术"  />

## 命令式和声明式编程

- 命令式:关注过程，直接操作 dom
- 声明式:关注结果，通过模板编写，根据虚拟 dom 判断增删改查

## 性能与可维护性

### 命令式与声明式:

- 命令式:
  只是直接修改的性能消耗

  命令式的性能 > 声明式的性能

- 声明式:
  需要找出差异 + 直接修改的性能消耗

  声明式的可维护性 > 命令式的可维护性(因为简单)

### 原生 js、innerHTML、虚拟 dom 比较:

- 心智负担: 虚拟 dom < innerHTML < 原生 js
- 性能: innerHTML < 虚拟 dom < 原生 js
- 可维护性: 原生 js < innerHTML < 虚拟 dom

## 运行时和编译时

#### 纯运行时、纯编译时以及两者都支持的框架各有什么特点？vue 采用哪种设计模式？

- 纯运行时: 虚拟 dom 树 传递给 render 函数生成 dom 的过程
- 纯编译: 开发写的 template 模板直接编译成原生 js，document.CreateELement...
- 运行时 ➕ 编译:开发编写 template，编译器将 template 模板编译成虚拟 dom 树，然后通过运行 render 函数将虚拟 dom 树生成 dom
- vue 采用编译+运行时的模式
