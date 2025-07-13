# 编译流水线---运行环境

##

1.  <span style='color:red'>V8</span> 如何提升 <span style='color:red'>JavaScript</span>执行速度

- 早期缓存机器码，之后重构为缓存字节码

2. 在 <span style='color:red'>JavaScript</span>中访问一个属性时，V8 做了哪些优化

- 隐藏类
- 内联缓存

## 运行时环境：运行 JavaScript 代码的基石

运行时环境包括：堆空间和栈空间、全局执行上下文、全局作用域、内置的内建函数、宿主环境提供的扩展函数和对象，还有消息循环系统

<img src="/img/v8/运行时环境.webp" alt="运行时环境"  />

## 宿主

<img src="/img/v8/宿主环境.webp" alt="宿主环境"  />
v8的宿主环境可以是浏览器，也可以是 node 环境

浏览器为 <span style='color:red'>V8</span> 提供基础的消息循环系统、全局变量、<span style='color:red'>Web API</span>

<span style='color:red'>V8</span>的核心是实现<span style='color:red'>ECMAScript</span>标准，比如：<span style='color:red'>Object</span>、<span style='color:red'>Function</span>、<span style='color:red'>String</span>，还提供垃圾回收、协程等

## 构造数据存储空间：堆空间和栈空间

在<span style='color:red'>Chrome</span>中，只要打开一个渲染进程，渲染进程便会初始化<span style='color:red'>V8</span>，同时初始化堆空间和栈空间。

栈是内存中连续的一块空间，采用“先进后出”的策略。

在函数调用过程中，涉及到上下文相关的内容都会存放在栈上，比如原生类型、引用的对象的地址、函数的执行状态、<span style='color:red'>this</span>值等都会存在栈上

当一个函数执行结束，那么该函数的执行上下文便会被销毁掉。

堆空间是一种树形的存储结构，用来存储对象类型的离散的数据，比如：函数、数组，在浏览器中还有<span style='color:red'>window</span>、<span style='color:red'>document</span>等

## 全局执行上下文和全局作用域

<img src="/img/v8/执行上下文.webp" alt="执行上下文"  />

执行上下文中主要包含三部分，变量环境、词法环境和<span style='color:red'>this</span>关键字

全局执行上下文在<span style='color:red'>V8</span>的生存周期内是不会被销毁的，它会一直保存在堆中

在<span style='color:red'>ES6</span>中，同一个全局执行上下文中，都能存在多个作用域：

```javascript
var x = 5;
{
  let y = 2;
  const z = 3;
}
```

<img src="/img/v8/作用域.webp" alt="作用域" width=300  />

当 V8 调用了一个函数时，就会进入函数的执行上下文，这时候全局执行上下文和当前的函数执行上下文就形成了一个栈结构。比如执行下面这段代码：

```javascript
var x = 1;
function show_x() {
  console.log(x);
}
function bar() {
  show_x();
}
bar();
```

当执行到 show_x 的时候，其栈状态如下图所示：
<img src="/img/v8/函数调用栈.webp" alt="函数调用栈" width=300  />

## 构造事件循环系统

<img src="/img/v8/事件循环系统.webp" alt="事件循环系统"  />

<span style='color:red'>V8</span>需要一个主线程，用来执行<span style='color:red'>JavaScript</span>和执行垃圾回收等工作

<span style='color:red'>V8</span>是寄生在宿主环境中的,<span style='color:red'>V8</span>所执行的代码都是在宿主的主线程上执行的

如果主线程正在执行一个任务，这时候又来了一个新任务，把新任务放到消息队列中，等待当前任务执行结束后，再从消息队列中取出正在排列的任务，执行完这个任务之后，再重复这个过程
