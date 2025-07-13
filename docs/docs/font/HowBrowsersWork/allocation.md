# chrome 浏览器分配渲染进程的机制

1. 如果两个标签页都位于同一个浏览上下文组，且属于同一站点，那么这两个标签页会被浏览器分配到同一个渲染进程中。

2. 如果这两个条件不能同时满足，那么这两个标签页会分别使用不同的渲染进程来渲染。
   现在你可以想一下，如果从 A 标签页中打开 B 标签页，那我们能肯定 A 标签页和 B 标签页属于同一浏览上下文组吗？
   不一定，如果在链接中 rel 属性加入了 noopener 属性，那么即使 a 标签打开同一站点的 b 标签页，那依然不会共用一个渲染进程，如图

<img src="/img/HowBrowsersWork/渲染进程分配机制.webp" alt="渲染进程分配机制" style="zoom: 33%;" />

从 a 标签页打开两个同一站点的两个标签页面 b 和 c，但是 chrome 是用三个渲染进程来渲染这三个页面而不是一个

这是因为 rel 属性加入了 noopener 和 noreferer 属性
<img src="/img/HowBrowsersWork/渲染进程分配机制2.webp" alt="渲染进程分配机制2" style="zoom: 33%;" />

当 <span style='color:red'>noopener</span> 属性被添加到 a 标签时，它会告诉浏览器在新页面中不要共享当前页面的进程。
这可以防止新页面操纵或访问当前页面的 window.opener 对象，从而提高安全性。

当 <span style='color:red'>noreferrer</span> 属性被添加到 a 标签时，它会告诉浏览器在新页面中不要共享当前页面的 referrer 信息。

这可以防止新页面获取当前页面的 URL 信息，从而提高隐私性。

#### 站点隔离

如果 iframe 和标签页不是同一个站点，那么 iframe 会单独被放在一个渲染进程中

```html
<head>
    <title>站点隔离:demo</title>
    <style>
        iframe {
            width: 800px;
            height: 300px;
        }
    </style>
</head>
<body>
    <div><iframe src="iframe.html"></iframe></div>
    <div><iframe src="https://www.infoq.cn/"></iframe></div>
    <div><iframe src="https://time.geekbang.org/"></iframe></div>
    <div><iframe src="https://www.geekbang.org/"></iframe></div>
</body>
</html>
```

不过如果 A 标签页和 B 标签页属于同一站点，却不属于同源站点，那么你依然无法通过 opener 来操作父标签页中的 DOM，这依然会受到同源策略的限制。

例如 https://time.geekbang.org和 "https://www.geekbang.org/"是同一站点，运行在同一个渲染进程中，但是不同源，所以依然会受到同源策略的影响

#### Chrome 为什么使用同一站点划分渲染进程，而不是使用同源策略来划分渲染进程？

多标签页时，同一站点比同源能有效节约渲染进程的个数
