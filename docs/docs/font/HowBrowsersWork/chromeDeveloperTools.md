# Chrome 开发者工具

## 利用网络面板做性能分析

<img src="/img/HowBrowsersWork/chrome-develop.webp" alt="开发者工具"  />

第一个是 Queuing，可以看出当下这个请求所需要等待的时间，会有很多原因导致该请求不能被立即执行，而是需要排队等待。导致请求处于排队状态的原因有很多。

大概率是由浏览器为每个域名最多维护 6 个连接导致的。那么基于这个原因，你就可以让 1 个站点下面的资源放在多个域名下面，比如放到 3 个域名下面，这样就可以同时支持 18 个连接了，这种方案称为域名分片技术。除了域名分片技术外，我个人还建议你把站点升级到 HTTP2，因为 HTTP2 已经没有每个域名最多维护 6 个 TCP 连接的限制了。

还有一个原因就是网络延迟慢
发送请求头的时候多带了一些多余的用户信息，导致服务器处理时间加长

### HTML 解析器是等整个 HTML 文档加载完成之后开始解析的，还是随着 HTML 文档边加载边解析的？

HTML 解析器并不是等整个文档加载完成之后再解析的，而是网络进程加载了多少数据，HTML 解析器便解析多少数据。

### 详细的流程：

网络进程接收到响应头之后，会根据响应头中的 content-type 字段来判断文件的类型，比如 content-type 的值是“text/html”，那么浏览器就会判断这是一个 HTML 类型的文件，然后为该请求选择或者创建一个渲染进程。渲染进程准备好之后，网络进程和渲染进程之间会建立一个共享数据的管道，网络进程接收到数据后就往这个管道里面放，而渲染进程则从管道的另外一端不断地读取数据，并同时将读取的数据“喂”给 HTML 解析器。你可以把这个管道想象成一个“水管”，网络进程接收到的字节流像水一样倒进这个“水管”，而“水管”的另外一端是渲染进程的 HTML 解析器，它会动态接收字节流，并将其解析为 DOM。

#### 字节流 ---> 分词器 ---> 生成 node 节点 ---> DOM

<img src="/img/HowBrowsersWork/字节流生成dom的过程.webp" alt="开发者工具"  />

### JavaScript 是如何影响 DOM 生成的？

```html
<html>
  <body>
    <div>1</div>
    <script>
      let div1 = document.getElementsByTagName('div')[0] div1.innerText =
      'time.geekbang'
    </script>
    <div>test</div>
  </body>
</html>
```

在 html 解析器在解析 html 文件生成 dom 的过程，遇到 script 标签，HTML 解析器就会暂停 DOM 的解析，因为接下来的 JavaScript 可能要修改当前已经生成的 DOM 结构。

如果是从外部引入 js 文件，那么这个解析过程就稍微复杂了些

```javascript
<html>
  <body>
    <div>1</div>
    <script type="text/javascript" src="foo.js"></script>
    <div>test</div>
  </body>
</html>
```

这段代码的功能还是和前面那段代码是一样的，不过这里我把内嵌 JavaScript 脚本修改成了通过 JavaScript 文件加载。其整个执行流程还是一样的，执行到 JavaScript 标签时，暂停整个 DOM 的解析，执行 JavaScript 代码，不过这里执行 JavaScript 时，需要先下载这段 JavaScript 代码。这里需要重点关注下载环境，因为 JavaScript 文件的下载过程会<span style='color:red'>阻塞 DOM 解析</span>，而通常下载又是非常耗时的，会受到网络环境、JavaScript 文件大小等因素的影响。

如果 js 脚本没有操作 dom 的话，可以设为异步加载，或者放在 html 文件的底部

异步加载：
async 和 defer 虽然都是异步的，不过还有一些差异，使用 async 标志的脚本文件一旦加载完成，会立即执行；而使用了 defer 标记的脚本文件，需要在 DOMContentLoaded 事件之前执行。

```javascript
<script async type="text/javascript" src="foo.js"></script>
```

```javascript
<script defer type="text/javascript" src="foo.js"></script>
```

- 如果脚本之间有依赖关系，需要按照顺序执行，或者需要在 DOMContentLoaded 事件之前执行，那么应该使用 defer 属性。（脚本有修改到 dom）
- 如果脚本独立于其他脚本，不依赖于页面加载完成，且加载和执行顺序无关紧要，那么可以使用 async 属性。

例子：

```javascript
<html>
  <head>
    <style src="theme.css"></style>
  </head>
  <body>
    <div>1</div>
    <script>
      let div1 = document.getElementsByTagName('div')[0] div1.innerText =
      'time.geekbang' //需要DOM div1.style.color = 'red' //需要CSSOM
    </script>
    <div>test</div>
  </body>
</html>
```

JavaScript 代码出现了 div1.style.color = ‘red' 的语句，它是用来操纵 CSSOM 的，所以在执行 JavaScript 之前，需要先解析 JavaScript 语句之上所有的 CSS 样式。所以如果代码里引用了外部的 CSS 文件，那么在执行 JavaScript 之前，还需要等待外部的 CSS 文件下载完成，并解析生成 CSSOM 对象之后，才能执行 JavaScript 脚本。

而 JavaScript 引擎在解析 JavaScript 之前，是不知道 JavaScript 是否操纵了 CSSOM 的，所以渲染引擎在遇到 JavaScript 脚本时，不管该脚本是否操纵了 CSSOM，都会执行 CSS 文件下载，解析操作，再执行 JavaScript 脚本。所以说 JavaScript 脚本是依赖样式表的，这又多了一个阻塞过程

所以也就是说解析 js 之前必须要暂停 dom 解析和完成 css 解析操作

<img src="/img/HowBrowsersWork/JS影响DOM.webp" alt="开发者工具"  />

### 输入一个 url 的流水线

1. 浏览器发出“提交文档”的消息给渲染进程，渲染进程收到消息后，会和网络进程建立传输数据的“管道”
2. 提交数据之后渲染进程会创建一个空白页面，我们通常把这段时间称为解析白屏，并等待 CSS 文件和 JavaScript 文件的加载完成，生成 CSSOM 和 DOM，然后合成布局树，最后还要经过一系列的步骤准备首次渲染。
3. 等首次渲染完成之后，就开始进入完整页面的生成阶段了，然后页面会一点点被绘制出来。

第二点出现的解析白屏，所以要想缩短白屏时长，可以优化以下三个步骤：
下载 CSS 文件、下载 JavaScript 文件和执行 JavaScript。
优化策略如下:

1. 通过<span style='color:red'>内联</span> JavaScript、内联 CSS 来移除这两种类型的文件下载，这样获取到 HTML 文件之后就可以<span style='color:red'>直接开始</span> 渲染流程了。
2. 但并不是所有的场合都适合内联，那么还可以尽量<span style='color:red'>减少文件大小</span> ，比如通过 webpack 等工具移除一些不必要的注释，并<span style='color:red'>压缩</span> JavaScript 文件。
3. 还可以将一些不需要在解析 HTML 阶段使用的 JavaScript 标记上<span style='color:red'>async</span> 或者 <span style='color:red'>defer</span>
4. 对于大的 CSS 文件，可以通过媒体查询属性，将其拆分为多个不同用途的 CSS 文件，这样<span style='color:red'>只有在特定的场景下才会加载特定的 CSS 文件</span>。
