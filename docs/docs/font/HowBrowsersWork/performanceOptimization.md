# 性能优化

## 页面性能优化分两个阶段：加载和交互阶段

### 加载阶段：

总的优化原则就是 1.减少关键资源个数，2. 降低关键资源大小，3. 降低关键资源的 RTT 次数。

1. JavaScript 和 CSS 改成内联的形式，另一种方式，如果 JavaScript 代码没有 DOM 或者 CSSOM 的操作，则可以改成 async 或者 defer 属性

2. 可以压缩 CSS 和 JavaScript 资源，移除 HTML、CSS、JavaScript 文件中一些注释内容

3. 使用 cdn 加载

### 交互阶段

减少 js 执行时间

1. 减少 JavaScript 脚本执行时间，将一次执行的函数分解为多个任务，使得每次的执行时间不要过久

2. 是采用 Web Workers。你可以把 Web Workers 当作主线程之外的一个线程，在 Web Workers 中是可以执行 JavaScript 脚本的，不过 Web Workers 中没有 DOM、CSSOM 环境，这意味着在 Web Workers 中是无法通过 JavaScript 来访问 DOM 的，所以我们可以把一些和 DOM 操作无关且耗时的任务放到 Web Workers 中去执行。

##### 避免强制同步布局

所谓强制同步布局，是指 JavaScript 强制将计算样式和布局操作提前到当前的任务中。

```javascript
function foo() {
  let main_div = document.getElementById('mian_div');
  let new_node = document.createElement('li');
  let textnode = document.createTextNode('time.geekbang');
  new_node.appendChild(textnode);
  document.getElementById('mian_div').appendChild(new_node);
  //由于要获取到offsetHeight，
  //但是此时的offsetHeight还是老的数据，
  //所以需要立即执行布局操作
  console.log(main_div.offsetHeight);
}
```

将新的元素添加到 DOM 之后，我们又调用了 main_div.offsetHeight 来获取新 main_div 的高度信息。如果要获取到 main_div 的高度，就需要重新布局，所以这里在获取到 main_div 的高度之前，JavaScript 还需要强制让渲染引擎默认执行一次布局操作。我们把这个操作称为强制同步布局。

<img src="/img/HowBrowsersWork/forcedPlacement.webp" alt="开发者工具"  />
为了避免强制同步布局，我们可以调整策略，在修改 DOM 之前查询相关值。代码如下所示：

```javascript
function foo() {
  let main_div = document.getElementById('mian_div');
  //为了避免强制同步布局，在修改DOM之前查询相关值
  console.log(main_div.offsetHeight);
  let new_node = document.createElement('li');
  let textnode = document.createTextNode('time.geekbang');
  new_node.appendChild(textnode);
  document.getElementById('mian_div').appendChild(new_node);
}
```

##### 避免布局抖动

还有一种比强制同步布局更坏的情况，那就是布局抖动。所谓布局抖动，是指在一次 JavaScript 执行过程中，多次执行强制布局和抖动操作。为了直观理解，你可以看下面的代码：

```javascript
function foo() {
  let time_li = document.getElementById('time_li');
  for (let i = 0; i < 100; i++) {
    let main_div = document.getElementById('mian_div');
    let new_node = document.createElement('li');
    let textnode = document.createTextNode('time.geekbang');
    new_node.appendChild(textnode);
    new_node.offsetHeight = time_li.offsetHeight;
    document.getElementById('mian_div').appendChild(new_node);
  }
}
```

我们在一个 for 循环语句里面不断读取属性值，<span style='color:red'>每次读取属性值之前都要进行计算样式和布局</span>。执行代码之后，使用 Performance 记录的状态如下所示：

<img src="/img/HowBrowsersWork/布局抖动.webp" alt="布局抖动"  />

从上图可以看出，在 foo 函数内部重复执行计算样式和布局，这会大大影响当前函数的执行效率。这种情况的避免方式和强制同步布局一样，都是尽量不要在修改 DOM 结构时再去查询一些相关值。

##### 合理利用 CSS 合成动画

合成动画是直接在合成线程上执行的，这和在主线程上执行的布局、绘制等操作不同，如果主线程被 JavaScript 或者一些布局任务占用，CSS 动画依然能继续执行。所以要尽量利用好 CSS 合成动画，如果能让 CSS 处理动画，就尽量交给 CSS 来操作。

##### 避免频繁的垃圾回收

我们知道 JavaScript 使用了自动垃圾回收机制，如果在一些函数中频繁创建临时对象，那么垃圾回收器也会频繁地去执行垃圾回收策略。这样当垃圾回收操作发生时，就会占用主线程，从而影响到其他任务的执行，严重的话还会让用户产生掉帧、不流畅的感觉。所以要尽量避免产生那些临时垃圾数据。那该怎么做呢？可以尽可能优化储存结构，尽可能避免小颗粒对象的产生。
