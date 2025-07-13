# 设计思想

## V8 引擎概述

### <span style='color:red'>V8</span> 主要涉及三个技术：编译流水线、事件循环系统、垃圾回收机制

### 1. <span style='color:red'>V8</span> 执行 <span style='color:red'>JavaScript</span> 完整流程称为：<span style='font-weight:bold'>编译流水线</span>

<img src="/img/v8/V8执行一段JavaScript流程图.webp" alt="V8执行一段JavaScript流程图"  />

#### 编译流水线涉及到的技术有：

#### JIT

- <span style='color:red'>V8</span> 混合编译执行和解释执行

#### 惰性解析

- 加快代码启动速度

#### 隐藏类(<span style='color:red'>Hide Class</span>)

- 将动态类型转为静态类型，消除动态类型执行速度慢的问题

#### 内联缓存

### 2. 事件循环系统

- <span style='color:red'>JavaScript</span> 中的难点：异步编程
- 调度排队任务，让 <span style='color:red'>JavaScript</span> 有序的执行

### 3. 垃圾回收机制

- 内存分配
- 内存回收

## V8 是如何执行一段 JavaScript 代码的？

#### 1. 准备基础环境：

- 全局执行上下文：全局作用、全局变量、内置函数
- 初始化内存中的堆和栈结构
- 初始化消息循环系统：消息驱动器和消息队列

#### 2. 结构化<span style='color:red'>JavaScript</span>源代码

- 生成抽象语法树（<span style='color:red'>AST</span>）
- 生成相关作用域

#### 3. 生成字节码：字节码是介于 <span style='color:red'>AST</span> 和机器码的中间代码

- 解释器可以直接执行
- 编译器需要将其编译为二进制的机器码再执行

#### 4. 解释器和监控机器人

- 解释器：按照顺序执行字节码，并输出执行结果
- 监控机器人：如果发现某段代码被重复多次执行，将其标记为热点代码

#### 5. 优化热点代码

- 优化编译器将热点代码编译为机器码
- 对编译后的机器码进行优化
- 再次执行到这段代码时，将优先执行优化后的代码

#### 6. 反优化

- <span style='color:red'>JavaScript</span> 对象在运行时可能会被改变，这段优化后的热点代码就失效了
- 进行反优化操作，给到解释器解释执行

## V8 中的对象和属性处理

### 函数即对象

函数是 js 中一等公民，因为函数可以赋值(赋值给变量)，可以作为参数传递，可以作为返回值，函数可以拥有属性和方法

<span style='color:red'>V8</span> 内部为函数对象添加了两个隐藏属性：<span style='color:red'>name</span>，<span style='color:red'>code</span>：

- <span style='color:red'>name</span> 为函数名

如果是匿名函数，<span style='color:red'>name</span> 为 <span style='color:red'>anonymous</span>

- <span style='color:red'>code</span> 为函数代码，以字符串的形式存储在内存中

<img src="/img/v8/name和code两个隐藏属性.webp" alt="name和code两个隐藏属性"  />

当执行到一个函数调用语句时，<span style='color:red'>V8</span> 从函数对象中取出 <span style='color:red'>code</span>属性值，然后解释执行这段函数代码

什么是闭包：<span style='font-weight:bold'>将外部变量和函数绑定起来的技术</span>

参考资料：https://v8.dev/blog/react-cliff

### 快属性和慢属性：V8 是怎样提升对象属性访问速度的？

<span style='color:red'>V8</span> 在实现对象存储时，没有完全采用字典的存储方式，因为字典是非线性的数据结构，查询效率会低于线性的数据结构

### 常规属性和索引属性

- 索引属性（<span style='color:red'>elements</span>）：数字属性按照索引值的大小升序排列
- 常规属性（<span style='color:red'>properties</span>）：字符串根据创建时的顺序升序排列

它们都是线性数据结构，分别为 <span style='color:red'>elements</span> 对象和 <span style='color:red'>properties</span> 对象

执行一次查询：先从 <span style='color:red'>elements</span> 对象中按照顺序读出所有元素，然后再从 <span style='color:red'>properties</span> 对象中读取所有的元素

### 快属性和慢属性

在访问一个属性时，比如：<span style='color:red'>foo.a</span>，<span style='color:red'>V8</span> 先查找出 <span style='color:red'>properties</span>，然后在从 <span style='color:red'>properties</span> 中查找出 <span style='color:red'>a</span> 属性

<span style='color:red'>V8</span>为了简化这一步操作，把部分<span style='color:red'>properties</span>存储到对象本身，默认是 <span style='color:red'>10</span> 个，这个被称为<span style='font-weight:bold'>对象内属性</span>

对象内属性是一种线性数据结构,也就是数组或链表这种结构。这种线性数据结构的属性访问效率较高,通常被称为<span style='color:red'>快属性</span>。

线性数据结构通常被称为<span style='color:red'>快</span>属性

线性数据结构进行大量数据的添加和删除，执行效率是非常低的，所以<span style='color:red'>V8</span>会采用慢属性策略

<span style='color:red'>慢</span>属性的对象内部有独立的非线性数据结构（字典）

总之,V8 通过区分"快属性"和"慢属性"的存储方式,在属性访问效率和动态修改属性之间进行权衡,以提高 JavaScript 代码的整体执行效率。

参考资料：https://v8.dev/blog/fast-properties

#### 快属性和慢属性与常规属性和索引属性之间的区别

快属性和慢属性与常规属性和索引属性之间的区别是<span style='color:red'>不同维度</span>的分化，而不是简单的优化关系。

常规属性和索引属性:

常规属性是指对象中定义的所有属性，通常是通过对象字面量或构造函数创建的。
索引属性是指使用数字索引的属性，通常用于数组等数据结构。
快属性和慢属性:

快属性是指在 V8 引擎中，特定的常规属性被优化存储在对象本身的线性数据结构中，以提高访问效率。快属性通常是那些被频繁访问的属性，V8 默认最多存储 10 个快属性。
慢属性则是指存储在对象独立的非线性数据结构（字典）中的属性，通常用于存储不常用或动态变化的属性。
因此，快属性和慢属性是基于性能和存储方式的优化，而常规属性和索引属性则是基于属性名称的类型不同的分类。快属性可以是常规属性的一种优化形式，但并不是所有的常规属性都是快属性。

总结来说，快属性和慢属性的区分主要是为了优化性能，而常规属性和索引属性的区分则是基于属性的定义方式。两者之间并没有直接的从属关系，而是各自独立的分类维度。

## V8 中的函数和作用域

### 变量提升

在 <span style='color:red'>js</span> 中有函数声明的方式有两种：

- 函数声明

```javascript
function foo() {
  console.log('foo');
}
```

- 函数表达式

```javascript
var foo = function () {
  console.log('foo');
};
```

在编译阶段 <span style='color:red'>V8</span> 解析到函数声明和函数表达式（变量声明）时：

函数声明，将其转换为内存中的函数对象，并放到作用域中
变量声明，将其值设置为 <span style='color:red'>undefined</span>，并当道作用域中

因为在编译阶段，是不会执行表达式的，只会分析变量的定义、函数的声明
所以如果在声明前调用 <span style='color:red'>foo</span> 函数：

- 使用函数声明不会报错
- 使用函数表达式会报错

在编译阶段将所有的变量提升到作用域的过程称为<span style='font-weight:bold'>变量提升</span>

### 立即执行函数

<span style='color:red'>js</span> 的圆括号 <span style='color:red'>()</span> 可以在中间放一个表达式

中间如果是一个函数声明，<span style='color:red'>V8</span> 就会把<span style='color:red'> (function(){})</span> 看成是函数表达式，执行它会返回一个函数对象

如果在函数表达式后面加上<span style='color:red'>()</span>，就被称为立即调用函数表达式

因为函数立即表达式也是表达式，所以不会创建函数对象，就不会污染环境

### 作用域链：V8 是如何查找变量的？

全局作用域是在<span style='color:red'>V8</span>启动过程中就创建了，且一直保存在内存中不会被销毁的，直至<span style='color:red'>V8</span>退出

而函数作用域是在执行该函数时创建的，当函数执行结束之后，函数作用域就随之被销毁掉了

因为<span style='color:red'>JavaScript</span>是基于词法作用域的，词法作用域就是指，查找作用域的顺序是按照函数定义时的位置来决定的。

词法作用域是静态作用域，根据函数在代码中的位置来确定的，作用域是在声明函数时就确定好了

动态作用域链是基于调用栈的，不是基于函数定义的位置的，可以认为<span style='color:red'>this</span>是用来弥补 JavaScript 没有动态作用域特性的,this 是运行时决定的。

## V8 中的原型和继承

### 原型链：V8 是如何实现对象继承的？

- 作用域链是沿着函数的作用域一级一级来查找变量的
- 原型链是沿着对象的原型一级一级来查找属性的
  <span style='color:red'>js</span> 中实现继承，是将<span style='color:red'>`__proto__`</span>指向对象，但是不推荐使用，主要原因是：

- 这是隐藏属性，不是标准定义的
- 使用该属性会造成严重的性能问题

### 继承

1. 用构造函数实现继承：

```javascript
function DogFactory(color) {
  this.color = color;
}
DogFactory.prototype.type = 'dog';
const dog = new DogFactory('Black');
dog.hasOwnProperty('type'); // false
```

2. ES6 之后可以通过 Object.create 实现继承

```javascript
const animalType = { type: 'dog' };
const dog = Object.create(animalType);
dog.hasOwnProperty('type'); // false
```

### new 背后做了这些事情

1. 帮你在内部创建一个临时对象
2. 将临时对象的 **proto** 设置为构造函数的原型，构造函数的原型统一叫做 prototype
3. return 临时对象

```javascript
function NEW(fn) {
  return function () {
    var o = { __proto__: fn.prototype };
    fn.apply(o, arguments);
    return o;
  };
}
```

### `__proto__`、prototype、constructor 区别

<span style='color:red'>prototype</span>是函数的独有的；<span style='color:red'>`__proto__`</span> 和 <span style='color:red'>constructor</span> 是对象独有的

由于函数也是对象，所以函数也有<span style='color:red'> `__proto__`</span> 和 <span style='color:red'>constructor</span>

<span style='color:red'>constructor</span> 是函数；<span style='color:red'>prototype</span> 和 <span style='color:red'>`__proto__`</span> 是对象

```javascript
typeof Object.__proto__; // "object"
typeof Object.prototype; // "object"
typeof Object.constructor; // "function"
```

```javascript
let obj = new Object();
obj.__proto__ === Object.prototype;
obj.constructor === Object;
```

<span style='color:red'>obj</span> 是 <span style='color:red'>Object</span> 的实例，所以 <span style='color:red'>obj.constructor === Object</span>

<span style='color:red'>obj</span>的是对象，<span style='color:red'>Object</span>是函数，所以<span style='color:red'> obj.`__proto__` === Object.prototype</span>

<img src="/img/v8/原型链.webp" alt="原型链"  />
在上图中：
Star 是构造函数。
Star.prototype 是 Star 的原型对象。
ldh 是通过 Star 构造函数创建的对象实例。
现在，让我们解释图中的关系：

ldh 对象实例通过 `__proto__`链接到 Star 的原型对象（Star.prototype）。
Star.prototype 通过 `__proto__` 链接到 Object 的原型对象（Object.prototype）。
Object.prototype 的 `__proto__` 指向 null。
如果我们尝试访问 ldh.shine()，JavaScript 引擎会：

首先在 ldh 对象本身查找 shine 方法。
如果没找到，就去 ldh.`__proto__`（即 Star.prototype）中查找。
在 Star.prototype 中找到 shine 方法并执行。
如果我们尝试访问 ldh.toString()：

在 ldh 对象中找不到。
在 Star.prototype 中也找不到。
最后在 Object.prototype 中找到 toString 方法并执行。
这个例子展示了图中描述的原型链结构，说明了对象、构造函数和原型之间的关系，以及 JavaScript 如何通过这个链条来查找属性和方法。

## V8 类型系统

### 类型转换：V8 是怎么实现 1+“2”的？

<span style='color:red'>V8</span>会提供了一个<span style='color:red'>ToPrimitive</span>方法，其作用是将<span style='color:red'>a</span>和<span style='color:red'>b</span>转换为原生数据类型

1. 先检测该对象中是否存在<span style='color:red'>valueOf</span>方法，如果有并返回了原始类型，那么就使用该值进行强制类型转换

2. 如果<span style='color:red'>valueOf</span>没有返回原始类型，那么就使用 toString 方法的返回值

3. 如果<span style='color:red'>valueOf</span>和<span style='color:red'>toString</span>两个方法都不返回基本类型值，便会触发一个 <span style='color:red'>TypeError</span>的错误。

对于表达式 1 + "2", V8 引擎会首先尝试将操作数转换为原始数据类型(primitive)。这个过程就是通过 ToPrimitive 方法实现的。
1 是原始数字类型,不需要转换。
"2" 是原始字符串类型,也不需要转换。
所以最终 V8 引擎会将 1 和 "2" 拼接成字符串 "12" 作为结果返回。
