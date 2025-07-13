# 事件循环和垃圾回收

## V8 事件循环机制

### 消息队列

<span style='color:red'>UI</span> 线程是运行窗口的线程，也叫主线程

当鼠标点击了页面，系统会将该事件交给<span style='color:red'>UI</span>线程来处理，但是<span style='color:red'>UI</span> 线程不能立即响应来处理

针对这种情况，浏览器为<span style='color:red'>UI</span> 线程提供了消息队列，然后 <span style='color:red'>UI</span> 线程会不断的从消息队列中取出事件和执行事件，如果当前没有任何消息等待被处理，那么这个循环就会被挂起

### setTimeout

在执行<span style='color:red'>setTimeout</span>，浏览器会将回调函数封装成一个事件，添加到消息队列中，然后<span style='color:red'>UI</span>线程会不间断的从消息队列中取出任务，执行任务，在合适的时机取出 setTimeout 的回调函数

### XMLHttpRequest

在<span style='color:red'>UI</span>线程执行<span style='color:red'> XMLHttpRequest</span>，会阻塞<span style='color:red'>UI</span>线程，所以 <span style='color:red'>UI</span>线程会将它分配给网络线程（是网络进程中的一个线程）：

1. <span style='color:red'>UI</span>线程从消息队列中取出任务，进行分析
2. 发现是一个下载任务，就会交给网络线程去执行
3. 网络线程接到下载请求后，会和服务器建立联系，发出下载请求
4. 网络线程不断从服务器接收数据
5. 网络请求在收到数据后，会将返回的数据和回调函数封装成一个事件，放在消息队列中
6. <span style='color:red'>UI</span>线程循环读取消息队列，如果是下载状态的事件，<span style='color:red'>UI</span>线程就会执行回调函数
7. 直到下载事件结束，页面显示下载完成

### 异步编程模型

#### 异步编程（一）：V8 是如何实现微任务的？

宏任务是消息队列中等待被主线程执行的事件，每个宏任务在执行的时候都会创建独立的执行栈，宏任务结束，执行栈会被清空

微任务是一个需要异步执行的函数，执行时机是在主函数执行结束之后，当前宏任务结束之前

微任务执行的时机：

1. 如果当前任务中产生了一个微任务，不会再当前的函数中被执行，所以执行微任务时，不会导致栈的无限扩张
2. 微任务会在当前任务执行结束之前被执行
3. 微任务结束执行之前，不会执行其他的任务

#### 异步编程（二）：V8 是如何实现 async/await 的？

### 生成器 Generator

带星号的函数配合 yield 可以实现函数的暂停和恢复，这个叫生成器

```javascript
function* getResult() {
  console.log('getUserID before');
  yield 'getUserID';
  console.log('getUserName before');
  yield 'getUserName';
  console.log('name before');
  return 'name';
}

let result = getResult();

console.log(result.next().value);
console.log(result.next().value);
console.log(result.next().value);
```

在生成器内部，如果遇到 <span style='color:red'>yield</span> 关键词，那么<span style='color:red'>V8</span>将 <span style='color:red'>yield</span> 后面的内容返回给外部，并暂停函数的执行

生成器暂停后，外面代码开始执行，如果想要继续恢复生成器的执行，就可以使用<span style='color:red'>result.next()</span>方法

在暂停和恢复之间切换，这背后的原理是协程，协程是比线程更加轻量级，它是跑在线程上的任务
一个线程有多个协程，但只能执行一个协程，如果<span style='color:red'>A</span>协程启动<span style='color:red'>B</span>协程，那<span style='color:red'>A</span>协程就是<span style='color:red'>B</span>协程的父协程

使用生成器编写同步代码

```javascript
function* getResult() {
  let id_res = yield fetch(id_url);
  console.log(id_res);
  let id_text = yield id_res.text();
  console.log(id_text);

  let new_name_url = name_url + '?id=' + id_text;
  console.log(new_name_url);

  let name_res = yield fetch(new_name_url);
  console.log(name_res);
  let name_text = yield name_res.text();
  console.log(name_text);
}
let result = getResult();
result
  .next()
  .value.then((response) => {
    return result.next(response).value;
  })
  .then((response) => {
    return result.next(response).value;
  })
  .then((response) => {
    return result.next(response).value;
  })
  .then((response) => {
    return result.next(response).value;
  });
```

把执行生成器代码的函数称为执行器（可参考著名的 co 框架）

```javascript
function* getResult() {
  let id_res = yield fetch(id_url);
  console.log(id_res);
  let id_text = yield id_res.text();
  console.log(id_text);

  let new_name_url = name_url + '?id=' + id_text;
  console.log(new_name_url);

  let name_res = yield fetch(new_name_url);
  console.log(name_res);
  let name_text = yield name_res.text();
  console.log(name_text);
}
co(getResult());
```

### async/await

<span style='color:red'>async</span>是异步执行并隐式返回 <span style='color:red'>Promise</span> 作为结果的函数。

<span style='color:red'>await</span> 后面可以接两种类型的表达式：

- 任何普通表达式
- Promise 对象的表达式

如果 <span style='color:red'>await</span> 等待的是一个 <span style='color:red'>Promise</span> 对象，它会暂停执行生成器函数，直到 <span style='color:red'>Promise</span> 对象变成 <span style='color:red'>resolve</span> 才会恢复执行，然后 <span style='color:red'>resolve</span> 的值作为 <span style='color:red'>await</span> 表达式的运算结果

```javascript
function NeverResolvePromise() {
  return new Promise((resolve, reject) => {});
}
function ResolvePromise() {
  return new Promise((resolve, reject) => resolve('resolve'));
}
async function getResult() {
  let a = await NeverResolvePromise();
  console.log(a); // 不会输出
}
async function getResult2() {
  let b = await ResolvePromise();
  console.log(b); // "resolve"
}
getResult();
getResult2();
console.log(0);
```

输出 0 、 resolve

<span style='color:red'>async</span> 是一个异步执行的函数，不会阻塞主线程的执行

<span style='color:red'>async</span> 函数在执行时，是一个单独的协程，可以用 <span style='color:red'>await</span> 来暂停，由于等待的是一个 <span style='color:red'>Promise</span> 对象，就可以用 <span style='color:red'>resolve</span> 来恢复该协程

## V8 垃圾回收机制

### 垃圾回收（一）：V8 的两个垃圾回收器是如何工作的？

1. 通过 <span style='color:red'>GC Root</span> 标记内存中活动对象和非活动对象。

- <span style='color:red'>V8</span> 采用可访问性（reachability）算法判断堆中的对象是是否为活动对象
  - <span style='color:red'>GC Root</span> 能够遍历到的对象，是可访问的（reachable），称为活动对象
  - <span style='color:red'>GC Root</span> 不能遍历到的对象，认为是不可访问的（unreachable），称为非活动对象
- 浏览器环境中有很多 <span style='color:red'>GC Root</span>
  - <span style='color:red'>window</span> 对象
  - <span style='color:red'>DOM</span>，由可以通过遍历文档到达的所有原生 DOM 节点组成
  - 存放栈上变量

1. 回收非活动对象所占用的内存
2. 回收后，做内存整理（可选，有些垃圾回收器不会产生内存碎片，比如副垃圾回收器）
   - 回收结束后，内存中会出现大量不连续的空间，这空间被称为内存碎片
   - 如果内存碎片太多的话，当需要较大连续的内存时，就会出现内存不足

<span style='color:red'>V8</span> 受代际假说影响，使用了两个垃圾回收器：主垃圾回收器(<span style='color:red'>Major GC</span>)，副垃圾回收器（<span style='color:red'>Minor GC</span>）

代际假说：

1. 大部分对象都是“朝生夕死”的，也就是说大部分对象在内存中存活的时间很短，比如函数内部声明的变量，或者块级作用域中的变量，当函数或者代码块执行结束时，作用域中定义的变量就会被销毁。因此这一类对象一经分配内存，很快就变得不可访问
2. 不死的对象，会活得更久，比如：<span style='color:red'>window、DOM、Web API</span> 等

#### V8 把堆分为两个区域：

- <span style='color:red'>新生代</span>：存放生存时间短的对象
  - 容量小， <span style='color:red'>1~8M</span>
  - 使用副垃圾回收器（ <span style='color:red'>Minor GC</span>）
  - 使用 <span style='color:red'>Scavenge</span> 算法，将新生代区域分成两部分
    - 对象区域 ( <span style='color:red'>from-space</span>)
    - 空闲区域 ( <span style='color:red'>to-space</span>)
      1. 对象区域放新加入的对象
      2. 对象区域快满的时候，执行垃圾清理（先标记，再清理）
      3. 清理的把活动对象复制到空闲区域，并且排序（空闲区域就没有内存碎片了）
      4. 复制完之后，把对象区域和空闲区域进行翻转
      5. 重复执行上面的步骤
      6. 经过两次垃圾回收后还存在的对象，移动到老生代中
- <span style='color:red'>老生代</span>：存放生存时间久的对象
  - 容量大
    - 对象占用空间大
    - 对象存活时间长
  - 使用主垃圾回收器（ <span style='color:red'>Major GC</span>）
  - 使用标记 - 清除算法（Mark-Sweep）
    - 标记：从根元素开始，找到活动对象，找不到的就是垃圾
    - 清理：直接清理垃圾（会产生垃圾碎片）
  - 或者使用标记 - 整理算法（ <span style='color:red'>Mark-Compact</span>）
    - 标记：从根元素开始，找到活动对象，找不到的就是垃圾
    - 整理：把活动对象向同一端移动，另一端直接清理（不会产生垃圾碎片）

<img src="/img/v8/v8垃圾回收.webp" alt="v8垃圾回收"  />

### 垃圾回收（二）：V8 是如何优化垃圾回收器执行效率的？

JavaScript 是运行在主线程上的，一旦执行垃圾回收算法，JavaScript 会暂停执行，等垃圾回收完毕后再恢复执行，这种行为成为全停顿（<span style='color:red'>Stop-The-World</span>）

V8 团队向现有的垃圾回收器添加并行、并发、增量等垃圾回收技术

这些技术主要从两方面解决垃圾回收效率的问题：

1. 将一个完整的垃圾回收任务拆分成多个小的任务
2. 将标记对象、移动对象等任务转移到后台线程进行

#### 并行回收（在主线程执行，全停顿）

<img src="/img/v8/并行回收.webp" alt="并行回收"  />

在主线程执行垃圾回收的任务时，开启多个协助线程，同时执行回收工作

采用并行回收，垃圾回收所消耗的时间 = <span style='color:red'>辅助线程数 \* 单个线程所消耗的时间</span> + 同步开销时间

在执行垃圾标记的过程中，主线程不会同时执行 JavaScript 代码，因此代码不会改变回收过程

假设内存状态是静态的，因此只要确保同时只有一个辅助线程在访问对象就好了

这是 V8 副垃圾回收器采用的策略，它在执行垃圾回收的过程中，启动多个线程来负责新生代中的垃圾清理，同时将对象空间中的数据移动到空闲区域，这操作会导致数据地址变了，所以还需要同步更新这些对象的指针

#### 增量回收（在主线程执行，穿插在各个任务之间）

<img src="/img/v8/增量标记.webp" alt="增量标记"  />

将标记工作分解为更小的块，穿插在主线程不同的任务之间执行

采用增量回收，垃圾回收器没必要一次执行完垃圾回收流程，每次执行的只是一小部分工作

增量回收是并发的，需要满足两点要求：

1. 垃圾回收可以随时被暂停和重启，暂停的时候需要保留扫描结果，等待下一次回收
2. 在暂停期间，被标记好的垃圾数据，如果被修改了，垃圾回收器需要正确的处理

在垃圾回收的时候，V8 使用三色标记法：

- 黑色：表示所有能访问到的数据（活动数据），且子节点已经都标记完成
- 白色：表示还没有被访问到，如果在一轮遍历结束还是白色，这个数据就会被回收
- 灰色：表示正在处理这个节点，且子节点还没被处理

垃圾回收器会根据有没有灰色的节点来判断这一轮遍历有没有结束

没有灰色：一轮遍历结束，可以清理垃圾

有灰色：一轮遍历还没结束，从灰色的节点继续执行

<img src="/img/v8/增量标记图.webp" alt="增量标记图" width=500  />

```javascript
window.a = Object();
window.a.b = Object();
window.a.b.c = Object();
```

执行到这段代码时，垃圾回收器标记的结果如下图所示：
<img src="/img/v8/增量标记3.webp" alt="增量标记3" width=500  />

然后又执行了另外一个代码，这段代码如下所示：

```javascript
window.a.b = Object(); //d
```

执行完之后，垃圾回收器又恢复执行了增量标记过程，由于 b 重新指向了 d 对象，所以 b 和 c 对象的连接就断开了。这时候代码的应用如下图所示：
<img src="/img/v8/增量标记图2.webp" alt="增量标记图2" width=500  />

标记为黑色的数据被修改了，也就是说黑色的节点引用了一个白色的节点，但是黑色的节点是已经完成标记的，这是它后面还有一个白色的节点是不会被标记为黑色的
这就需要一个约束条件：不能让黑色节点指向白色节点

这个约束条件是：<span style='color:red'>写屏障机制（Write-barrier）</span>：
当发生黑色节点引用白色节点，写屏障机制会强制将这个白色节点变为灰色的，从而保证黑色节点不能指向白色节点

这种方法被称为<span style='color:red'>强三色不变性</span>

#### 并发回收（不在主线程执行）

<img src="/img/v8/并发回收.webp" alt="并发回收" width=500  />

在主线程执行 JavaScript 时，辅助线程在后台执行垃圾回收操作

<span style='color:red'>优点</span>：主线程不会被挂起（JavaScript 可以自由执行，同时辅助线程可以执行垃圾回收）

<span style='color:red'>缺点</span>：难实现

主线程执行 JavaScript 时，堆中的内容随时会变化，就会使得辅助线程之前的工作白做

主线程和辅助线程可能会在同一时间去修改同一个对象，这就需要额外实现读写锁的功能

#### 总结：

V8 最开始的垃圾回收器有两个特点，第一个是垃圾回收在主线程上执行，第二个特点是一次执行一个完整的垃圾回收流程。

由于这两个原因，很容易造成主线程卡顿，所以 V8 采用了很多优化执行效率的方案。

第一个方案是并行回收，在执行一个完整的垃圾回收过程中，垃圾回收器会使用多个辅助线程来并行执行垃圾回收。

第二个方案是增量式垃圾回收，垃圾回收器将标记工作分解为更小的块，并且穿插在主线程不同的任务之间执行。采用增量垃圾回收时，垃圾回收器没有必要一次执行完整的垃圾回收过程，每次执行的只是整个垃圾回收过程中的一小部分工作。

第三个方案是并发回收，回收线程在执行 JavaScript 的过程，辅助线程能够在后台完成的执行垃圾回收的操作。

主垃圾回收器就综合采用了所有的方案，副垃圾回收器也采用了部分方案。
