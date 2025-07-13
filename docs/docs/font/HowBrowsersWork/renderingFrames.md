# 渲染帧

手机、电脑，它们的默认刷新频率都是 60FPS，也就是屏幕在 1s 内渲染 60 次，约 16.7ms 渲染一次屏幕。这就意味着，我们的浏览器最佳的渲染性能就是所有的操作在一帧 16.7ms 内完成，能否做到一帧内完成直接决定着渲染性，影响用户交互。浏览器的 fps 指浏览器每一秒的帧数，fps 越大，每秒的画面就越多，浏览器的显示就越流畅。

<img src="/img/HowBrowsersWork/渲染帧.webp" alt="渲染帧"  />

<span style='color:red'>标准渲染帧</span>:在一个标准帧渲染时间 16.7ms 之内，浏览器需要完成主线程的操作，并 commit 给 Compositor 进程

在 Chrome 浏览器中,合成和渲染的处理方式如下:

<span style='color:red'>渲染进程</span>: Chrome 的渲染进程包含一个合成线程,负责将页面元素合成为最终的帧。合成线程接收来自主线程的更新信息(如 DOM 变化、动画等),并将其合成为中间结果。

<span style='color:red'>Compositor 进程</span>: Chrome 的一个独立进程,专门负责页面的最终合成和渲染。

渲染进程将中间合成结果传递给 Compositor 进程,由 Compositor 进程完成最终的合成和渲染。

<span style='color:red'>进程间通信</span>:主线程和合成线程在渲染进程内部进行通信。
渲染进程将中间合成结果通过 IPC (进程间通信) 传递给 Compositor 进程。

<img src="/img/HowBrowsersWork/主线程和合成进程通信.webp" alt="主线程和合成进程通信"  />

<span style='color:red'>丢帧：主线程里操作太多，耗时长，commit 的时间被推迟，浏览器来不及将页面 draw 到屏幕，这就丢失了一帧</span>

<img src="/img/HowBrowsersWork/丢帧.webp" alt="丢帧"  />

在浏览器的一个渲染帧（16.7ms）里，会存在一段时间，叫做空闲时间（idle period），如果完成各种任务的执行以及页面渲染的工作等的时间少于 16.7 ms，那么这一帧就会存在空闲时间，可以把一些耗时操作拆分开来，然后在每一帧的空闲时间中去执行。

<img src="/img/HowBrowsersWork/空闲.webp" alt="空闲"  />

<span style='color:red'>所谓的页面卡顿、首屏加载慢，根本原因都是执行长任务，使得页面的渲染时机推后，在每一帧里得不到渲染，从而造成用户的不好体验。要想解决用户体验差的问题，那么就需要知道浏览器渲染过程中的每一帧都干了些啥任务，是啥原因导致渲染时机推后</span>

#### 使用工具

浏览器性能检测工具 Performance

<img src="/img/HowBrowsersWork/performance面板.webp" alt="performance面板"  />

具体可以 Google 官方给的例子：
https://googlechrome.github.io/devtools-samples/jank/

左侧有一些按钮，点击 Stop 小球停止运动，点击 Add、Subtract 可以控制小球数量的增减，比较有意思的一个点是，当小球的数量越来越多，页面会越来越卡顿，如果点击 Optimize（优化），那么页面就会恢复正常。

接下来借助 Performance 来分析页面卡顿的原因：
<img src="/img/HowBrowsersWork/performace结果.webp" alt="performace结果"  />

录制大概 4 秒钟，可以看到该页面的性能确实存在很大的问题，我们首先分析这张图里面的一些内容：

<span style='color:red'>总览区</span>： 可以看到每个阶段的具体耗时，这里很明显是渲染占据了 90% 的时间，而 JS 脚本的执行、页面绘制并不耗时，现在已经可以定位到是渲染存在问题。

<img src="/img/HowBrowsersWork/总览.webp" alt="总览"  />

<span style='color:red'>帧</span>： 绿色代表该帧正常，黄色表示丢帧

<img src="/img/HowBrowsersWork/帧.webp" alt="帧"  />

<span style='color:red'>主线程</span>： 以其中的一个 Task 为例：标红代表该任务是长任务（一般认为超过 50ms 的任务是长任务），往下是该任务具体的细节，比如这个 Task 里主要执行了 Animation Frame Fired 方法，它里面调用了 Function Call，Function Call 里面调用了 app.update 的方法，一层一层往下调用执行，然后在 app.update 下面我们可以看到很多紫色的线条，紫色代表回流重绘。

<img src="/img/HowBrowsersWork/task.webp" alt="task"  />

现在可以初步下结论：频繁的回流重绘导致页面卡顿，后面还要再进行分析才能确定。
接下来点击其中的一个任务，观察 Call Tree，每个方法的执行时间都能看到，以及时间的占比
<img src="/img/HowBrowsersWork/callTree.webp" alt="callTree"  />

我们的分析目标主要是寻找花费时间长的任务，依次点开，可以发现 90% 的时间是花费在 Layout，点击右侧进入源码：
<img src="/img/HowBrowsersWork/calltree_detail.webp" alt="calltree_detail"  />

<img src="/img/HowBrowsersWork/offsetTop.webp" alt="offsetTop"  />

分析这段代码我们已经可以知道问题出在哪里了，<span style='color:red'>读取 offsetTop 会触发回流重绘</span>，这里用了个 for 循环，所以当小球的数量越来越多的时候，不断的读取 offsetTop 属性，导致频繁的触发回流重绘，最终页面卡顿。

#### 频繁的回流重绘导致卡顿

我们需要解答两个问题：

为什么频繁的回流重绘会导致卡顿？

计算复杂度： 回流涉及到重新计算元素的位置和几何属性，这可能需要遍历整个 DOM 树，并重新计算样式。这个计算过程比较复杂，尤其是在大型、复杂的页面上。
渲染的停顿： 当发生回流时，浏览器可能需要停止渲染，重新计算布局，然后再重新绘制，这可能导致页面的停顿或闪烁。
频繁触发： 如果在用户与页面交互的过程中频繁地触发回流和重绘，可能会导致性能问题。比如，在滚动页面时，如果频繁改变元素的样式，可能会引起多次回流和重绘，从而影响流畅度。
也就是说，频繁的回流重绘可以看做是耗时严重的任务，阻碍了页面的渲染，从而导致卡顿！

为什么读取 offsetTop 属性会触发回流重绘？

这与浏览器的优化机制有关：由于每次回流与重绘都会带来额外的计算消耗，为了优化这个过程，大多数浏览器采用了队列化修改并批量执行的策略。浏览器会将修改操作添加到队列中，直至一定时间段过去或操作达到阈值时，才会清空队列。
然而，当需要获取布局信息时，浏览器会强制刷新队列。这意味着，当你读取元素的布局信息如 offsetTop、offsetLeft 等时，需要返回最新的布局信息，因此浏览器不得不清空队列，触发回流和重绘操作以返回正确的值。

那么如何进行优化呢？知道是 <span style='color:red'>offsetTop</span> 的问题后，不用这个属性就行了，我们看下这个例子的处理方式：

<img src="/img/HowBrowsersWork/优化结果.webp" alt="优化结果"  />

使用 style.top 属性取代 offsetTop 即可，当然这两个属性也有一定的区别，这里不再展开，这样就能完美的解决页面卡顿的问题！

使用 style.top 替代 offsetTop 解决了页面卡顿的问题，背后涉及到浏览器的渲染机制，尤其是「布局重排（Reflow）」和「重绘（Repaint）」。

#### 浏览器渲染机制

浏览器的渲染过程主要有以下几个步骤：

1. 布局（Layout）：计算每个元素的大小和位置，也就是「重排」。
2. 绘制（Paint）：根据元素的样式将它们绘制到屏幕上，也就是「重绘」。
3. 合成（Composite）：把绘制的图层合成并显示在屏幕上。

#### offsetTop vs .style.top

- offsetTop: 是一个只读属性，用来获取元素相对于其包含元素的顶部的偏移量。访问 offsetTop 会触发浏览器去重新计算元素的布局，因为它必须确保返回的值是最新的。这会导致「强制同步布局」，也就是说，浏览器不得不先完成所有的布局计算，甚至触发「重排」操作来确保返回准确的数值。当页面上有很多元素时，频繁访问 offsetTop 会导致性能问题，因为每次读取都会引发「重排」。
- style.top: 这是一个纯粹的样式属性，代表元素的 top 值，不会触发重排或者强制同步布局。它只修改元素的渲染，而不重新计算页面的布局。因此，使用 style.top 仅涉及「重绘」操作，性能消耗远小于 offsetTop。

为什么使用 style.top 不会卡顿？

- 使用 style.top 修改元素的位置时，浏览器不需要重新计算整个页面的布局，而是仅仅需要更新元素的显示，涉及的是「重绘」。
- 而使用 offsetTop 会频繁触发「布局重排」，这在页面元素数量多时会极大增加计算开销，导致卡顿。

综上，替换为 style.top 可以避免触发重排，减少计算开销，从而提升性能，使得页面流畅不卡顿。
如果你想进一步优化，使用 requestAnimationFrame 来进行动画更新也是一种常见的性能优化手段。

#### setTimeout 与 requestAnimationFrame

setTimeout：是宏任务，有延时性，时效性没有 requestAnimationFrame 好。

requestAnimationFrame：是基于帧调用回调的，根据屏幕的刷新率来，比如每秒 60 帧的，那屏幕每秒刷新 60 次，调用 60 次回调。

任务优先级
按照不同的任务类型来划分任务优先级，基于不同的场景来动态调整消息队列的优先级。

然而，有一个问题就是，如果不断地有新的高优先级的任务进来，那么就会导致低优先级的任务一直得不到处理，即出现<span style='color:red'>任务饿死。因此，Chrome 进行了改变</span>，如果连续执行了一定数量的高优先级的任务，那么中间会执行一次低优先级的任务。

<img src="/img/HowBrowsersWork/执行优先级.webp" alt="执行优先级"  />
