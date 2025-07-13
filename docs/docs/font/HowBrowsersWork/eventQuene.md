# 消息队列和事件循环

## 浏览器宿主环境提供的消息队列和事件循环

<img src="/img/HowBrowsersWork/事件循环.png" alt="标记整理"  />

- 1. 如果`其他进程`想要发送任务给页面`主线程`，那么先通过 IPC 把任务发送给`渲染进程`的 `IO 线程`，IO 线程再把任务发送给页面`主线程`（<span style='color:red'>进程间通信</span>）。
- 2. 消息队列机制并不是太灵活，为了适应效率和实时性，引入了`微任务`。（如果定时器多的话，宏任务的消息队列中的回调任务就会变多，任务的`实时性就不高`，微任务则不同，在完成当前宏任务之前必须要执行完微任务，所以`微任务`的`实时性更高`）

### 宏任务和微任务

- <span style='color:red'>宏任务</span> :

把异步回调函数封装成一个宏任务，添加到消息队列尾部，当循环系统执行到该任务的时候执行回调函数。

- <span style='color:red'>微任务</span> :

在主函数执行结束之后、当前宏任务结束之前执行回调函数，这通常都是以微任务形式体现的。
每次创建一个宏任务的时候都会创建一个微任务队列，在执行完一个宏任务前会清空当前宏任务内的微任务队列
全局执行上下文本身也是一个宏任务，所以全局执行上下文也有自己的微任务队列

<img src="/img/HowBrowsersWork/宏微任务.png" alt="宏微任务"  />

##### MutationObserver（微任务）

- MutationObserver 可以监听 dom 的变化，频繁的操作 dom 并不会带来多大的性能问题，因为 MutationObserver 通过异步调用和减少触发次数来缓解了性能问题。即使多次 DOM 变化后，一次触发异步调用

##### promise（微任务）

Promise 是 JavaScript 中用来表示异步操作最终完成（或失败）及其结果的机制。它提供了比直接使用回调函数更优雅的方式来处理异步操作。

##### 深入分析 setTimeout 的执行机制与限制 （宏任务）

浏览器的页面是通过消息队列和事件循环系统来驱动的。settimeout 的函数会被加入到延迟消息队列中，
等到执行完 Task 任务之后就会执行延迟队列中的任务。然后分析几种场景下面的 setimeout 的执行方式。

1. 如果执行一个很耗时的任务，会影响延迟消息队列中任务的执行
2. 存在嵌套带调用时候，系统会设置最短时间间隔为 4ms（超过 5 层，设置为 0ms 也会是 4ms）
3. 未激活的页面，setTimeout 最小时间间隔为 1000ms（未激活即非当前打开的 tab 页面）
4. 延时执行时间的最大值 2147483647，溢出会导致定时器立即执行
5. setTimeout 设置回调函数 this 会是回调时候对应的 this 对象，可以使用箭头函数解决

### 如何理解 requestAnimationFrame 是基于时间的？（宏任务，但在宏任务中优先级较高）

requestAnimationFrame 函数会在浏览器每一次重绘之前调用指定的回调函数。浏览器的重绘频率通常是每秒 60 帧（即 60 次重绘），也就是每秒执行 60 次回调函数。
如果浏览器的重绘频率是每秒 45 帧，那么 requestAnimationFrame 函数会每隔 1/45 秒调用一次回调函数，即每秒执行 45 次回调函数。这样可以保持动画的流畅性，并且适应不同的浏览器性能和设备。
总结起来，requestAnimationFrame 函数会根据浏览器的重绘频率自动调节帧率，保持动画的流畅性。每一次重绘之前，都会调用一次回调函数，以更新动画的状态和样式。

所以 requestAnimationFrame 的实时性比 settimeout 高

### 浏览器:XMLHttpRequest 是怎么实现请求的？（宏任务）

1. 创建 XMLHttpRequest 对象
2. 注册相关事件回调处理函数
3. 打开请求
4. 配置参数（超时处理、错误处理等）
5. 发送请求

   一切准备就绪之后，就可以调用 xhr.send 来发起网络请求了。你可以对照下面那张请求流程图，可以看到：渲染进程会将请求发送给网络进程，然后网络进程负责资源的下载，等网络进程接收到数据之后，就会利用 IPC 来通知渲染进程；渲染进程接收到消息之后，会将 xhr 的回调函数封装成任务通过渲染进程中的 io 线程添加到消息队列中，等主线程循环系统执行到该任务的时候，就会根据相关的状态来调用对应的回调函数。如果网络请求出错了，就会执行 xhr.onerror；如果超时了，就会执行 xhr.ontimeout；如果是正常的数据接收，就会执行 onreadystatechange 来反馈相应的状态。
   <img src="/img/HowBrowsersWork/网络进程请求.png" alt="网络进程请求"  />

以下是代码:

```javascript
function GetWebData(URL) {
  /**
   * 1:新建XMLHttpRequest请求对象
   */
  let xhr = new XMLHttpRequest();

  /**
   * 2:注册相关事件回调处理函数
   */
  xhr.onreadystatechange = function () {
    switch (xhr.readyState) {
      case 0: //请求未初始化
        console.log('请求未初始化');
        break;
      case 1: //OPENED
        console.log('OPENED');
        break;
      case 2: //HEADERS_RECEIVED
        console.log('HEADERS_RECEIVED');
        break;
      case 3: //LOADING
        console.log('LOADING');
        break;
      case 4: //DONE
        if (this.status == 200 || this.status == 304) {
          console.log(this.responseText);
        }
        console.log('DONE');
        break;
    }
  };

  xhr.ontimeout = function (e) {
    console.log('ontimeout');
  };
  xhr.onerror = function (e) {
    console.log('onerror');
  };

  /**
   * 3:打开请求
   */
  xhr.open('Get', URL, true); //创建一个Get请求,采用异步

  /**
   * 4:配置参数
   */
  xhr.timeout = 3000; //设置xhr请求的超时时间
  xhr.responseType = 'text'; //设置响应返回的数据格式
  xhr.setRequestHeader('X_TEST', 'time.geekbang');

  /**
   * 5:发送请求
   */
  xhr.send();
}
```

### 协程

像一个进程可以拥有多个线程一样，一个线程也可以拥有多个协程，最重要的是，协程不是被操作系统内核所管理，而完全是由程序所控制（也就是在`用户态`执行）。这样带来的好处就是性能得到了很大的提升，不会像线程切换那样消耗资源。

```javascript
async function foo() {
  console.log(1);
  let a = await 100;
  console.log(a);
  console.log(2);
}
console.log(0);
foo();
console.log(3);
```

<img src="/img/HowBrowsersWork/协程.png" alt="协程"  />

- 首先，执行 console.log(0)这个语句，打印出来 0
- 紧接着就是执行 foo 函数，由于 foo 函数是被 async 标记过的，所以当进入该函数的时候，JavaScript 引擎会保存当前的调用栈等信息，然后执行 foo 函数中的 console.log(1)语句，并打印出 1。
- 接下来就执行到 foo 函数中的 await 100 这个语句了，这里是我们分析的重点，因为在执行 await 100 这个语句时，JavaScript 引擎在背后为我们默默做了太多的事情，那么下面我们就把这个语句拆开，来看看 JavaScript 到底都做了哪些事情。当执行到 await 100 时，会默认创建一个 Promise 对象，代码如下所示：

```javascript
let promise_ = new Promise((resolve,reject){
  resolve(100)
})
```

在这个 promise\_ 对象创建的过程中，我们可以看到在 executor 函数中调用了 resolve 函数，JavaScript 引擎会将该任务提交给微任务队列。然后 JavaScript 引擎会暂停当前协程的执行，将主线程的控制权转交给父协程执行，同时会将 promise\_ 对象返回给父协程。主线程的控制权已经交给父协程了，这时候父协程要做的一件事是调用 promise\_.then 来监控 promise 状态的改变。接下来继续执行父协程的流程，这里我们执行 console.log(3)，并打印出来 3。随后父协程将执行结束，在结束之前，会进入微任务的检查点，然后执行微任务队列，微任务队列中有 resolve(100)的任务等待执行，执行到这里的时候，会触发 promise\_.then 中的回调函数，如下所示

```javascript
promise_.then((value) => {
  //回调函数被激活后
  //将主线程控制权交给foo协程，并将vaule值传给协程
});
```

该回调函数被激活以后，会将主线程的控制权交给 foo 函数的协程，并同时将 value 值传给该协程。foo 协程激活之后，会把刚才的 value 值赋给了变量 a，然后 foo 协程继续执行后续语句，执行完成之后，将控制权归还给父协程。以上就是 await/async 的执行流程。正是因为 async 和 await 在背后为我们做了大量的工作，所以我们才能用同步的方式写出异步代码来。

例子：

```javascript
async function foo() {
  console.log('foo');
}
async function bar() {
  console.log('bar start');
  await foo();
  console.log('bar end');
}
console.log('script start');
setTimeout(function () {
  console.log('setTimeout');
}, 0);
bar();
new Promise(function (resolve) {
  console.log('promise executor');
  resolve();
}).then(function () {
  console.log('promise then');
});
console.log('script end');
```

1. 首先在主协程中初始化异步函数 foo 和 bar，碰到 console.log 打印 script start；
2. 解析到 setTimeout，初始化一个 Timer，创建一个新的 task
3. 执行 bar 函数，将控制权交给协程，输出 bar start，碰到 await，执行 foo，输出 foo，创建一个 Promise 返回给主协程
4. 将返回的 promise 添加到微任务队列，向下执行 new Promise，输出 promise executor，返回 resolve 添加到微任务队列
5. 输出 script end
6. 当前 task 结束之前检查微任务队列，执行第一个微任务，将控制器交给协程输出 bar end
7. 执行第二个微任务 输出 promise then
8. 当前任务执行完毕进入下一个任务，输出 setTimeout

### 生成器 generator 函数是如何暂停执行程序的？

generator 函数是一个`生成器`，执行它会返回一个`迭代器`，这个迭代器同时也是一个`协程`。一个线程中可以有多个协程，但是`同时`只能有`一个协程在执行`。线程的执行是在内核态，是由操作系统来控制；协程的执行是在用户态，是完全由程序来进行控制，通过调用生成器的 next()方法可以让该协程执行，通过 yield 关键字可以让该协程暂停，交出主线程控制权，通过 return 关键字可以让该协程结束。协程切换是在用户态执行，而线程切换时需要从用户态切换到内核态，在内核态进行调度，协程相对于线程来说更加轻量、高效。

### async/await

- 其实 async/await 技术背后的秘密就是 Promise 和生成器应用
- 往底层说就是微任务和协程应用（promise 是微任务的一种实现形式，生成器是协程的一种实现形式）
  要搞清楚 async 和 await 的工作原理，我们就得对 async 和 await 分开分析。

```javascript
async function foo() {
  console.log(1);
  let a = await 100;
  console.log(a);
  console.log(2);
}
console.log(0);
foo();
console.log(3);
```

- 执行 console.log(0)这个语句，打印出来 0。
- 紧接着就是执行 foo 函数，由于 foo 函数是被 async 标记过的，所以当进入该函数的时候，JavaScript 引擎会保存当前的调用栈等信息，然后执行 foo 函数中的 console.log(1)语句，并打印出 1。
- 接下来就执行到 foo 函数中的 await 100 这个语句了，这里是我们分析的重点，因为在执行 await 100 这个语句时，JavaScript 引擎在背后为我们默默做了太多的事情，那么下面我们就把这个语句拆开，来看看 JavaScript 到底都做了哪些事情。
- 当执行到 await 100 时，会默认创建一个 Promise 对象，代码如下所示：

```javascript
let promise_ = new Promise((resolve,reject){ resolve(100)})
```

<span style='color:red;font-weight:bold'>TODO promise a+规范原理</span>
