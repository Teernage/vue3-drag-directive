# 浏览器安全

## 同源策略

如果两个 URL 的<span style='color:red'>协议、域名</span>和<span style='color:red'>端口号</span>都相同，我们就称这两个 URL 同源。
同源策略主要表现在<span style='color:red'> DOM、Web 数据和网络</span>这三个层面。

1. DOM 层面。同源策略<span style='color:red'>限制</span>了来自<span style='color:red'>不同源</span>的 JavaScript 脚本对<span style='color:red'>当前</span> DOM 对象读和写的操作。
2. 数据层面。同源策略<span style='color:red'>限制了不同源</span>的站点读取当前站点的<span style='color:red'> Cookie、IndexDB、LocalStorage </span>等数据。
3. 网络层面。同源策略限制了通过 XMLHttpRequest 等方式将站点的数据<span style='color:red'>发送给不同源</span>的站点。

### 安全和便利性的权衡

既然只能用同源的数据，为什么页面可以引入第三方资源？

这是只能获取同个源的数据的话会有诸多限制，所以同源策略对于资源的引用开了一个口子，所以也就可以引用第三方资源，但同时第三方资源有可能是恶意的，可能是 xss 攻击，所以为了解决 XSS 攻击，浏览器中引入了内容安全策略，称为 CSP，CSP 的核心思想是让服务器决定浏览器能够加载哪些资源，让服务器决定浏览器是否能够执行内联 JavaScript 代码。通过这些手段就可以大大减少 XSS 攻击。

### 跨域资源共享和跨文档消息机制

跨域资源共享（CORS），使用该机制可以进行跨域访问控制，从而使跨域数据传输得以安全进行。
跨文档消息机制，可以通过 window.postMessage 的 JavaScript 接口来和不同源的 DOM 进行通信。

### <span style='color:red'>同源策略、CSP 和 CORS 之间的关系：</span>

同源策略就是说同源页面随你瞎搞，但是不同源之间想瞎搞只能通过浏览器提供的手段来搞

比如说

1. 读取数据和操作不同源页面的 DOM 要用跨文档机制
2. 跨域请求要用 CORS 机制
3. 引用第三方资源要用 CSP

## XSS 攻击

xss 跨站脚本攻击，XSS 攻击是指黑客往 HTML 文件中或者 DOM 中注入恶意脚本，从而在用户浏览页面时利用注入的恶意脚本对用户实施攻击的一种手段。

1. 可以<span style='color:red'>窃取重要的 Cookie</span>信息发送到恶意服务器上
2. 可以<span style='color:red'>监听</span>用户行为，通过监听事件 addEventListener 获取用户输入的账号和密码
3. 可以通过修改 DOM <span style='color:red'>伪造假的登录窗口</span>，用来欺骗用户输入用户名和密码等信息
4. 页面内生成浮窗广告

#### 恶意脚本是怎么注入的

三种方式来注入恶意脚本

1. <span style='color:red'>存储型</span> XSS 攻击（服务器漏洞）
2. <span style='color:red'>反射型</span> XSS 攻击
3. <span style='color:red'>基于 DOM</span> 的 XSS 攻击

##### 存储型 xss 攻击

<img src="/img/HowBrowsersWork/存储型xss攻击.webp" alt="存储型xss攻击"  />

- 首先黑客利用站点漏洞将一段恶意 JavaScript 代码提交到网站的数据库中；
- 然后用户向网站请求包含了恶意 JavaScript 脚本的页面；
- 当用户浏览该页面的时候，恶意脚本就会将用户的 Cookie 信息等数据上传到服务器。

例如：之前喜马拉雅 FM 出现过一次存储型 xss 攻击

<img src="/img/HowBrowsersWork/喜马拉雅xss攻击.webp" width=500 alt="喜马拉雅xss攻击"  />

当黑客将专辑名称设置为一段 JavaScript 代码并提交时，喜马拉雅的服务器会保存该段
JavaScript 代码到数据库中。然后当用户打开黑客设置的专辑时，这段代码就会在用户的页面里执行（如下图），这样就可以获取用户的 Cookie 等数据信息。

黑客拿到了用户 Cookie 信息之后，就可以利用 Cookie 信息在其他机器上登录该用户的账号（如下图），并利用用户账号进行一些恶意操作。

#### 反射型 XSS 攻击

<img src="/img/HowBrowsersWork/反射性xss攻击.webp" alt="反射性xss攻击"  />
通过这个操作，我们会<span style='font-weight:bold'>发现用户将一段含有恶意代码的请求提交给 Web 服务器，Web 服务器接收到请求时，又将恶意代码反射给了浏览器端，这就是反射型 XSS 攻击。</span>在现实生活中，黑客经常会通过 QQ 群或者邮件等渠道诱导用户去点击这些恶意链接，所以对于一些链接我们一定要慎之又慎。另外需要注意的是，Web 服务器不会存储反射型 XSS 攻击的恶意脚本，这是和存储型 XSS 攻击不同的地方。

#### 基于 DOM 的 XSS 攻击

基于 DOM 的 XSS 攻击是不牵涉到页面 Web 服务器的。具体来讲，黑客通过各种手段将恶意脚本注入用户的页面中，比如通过网络劫持在页面传输过程中修改 HTML 页面的内容，这种劫持类型很多，有通过 WiFi 路由器劫持的，有通过本地恶意软件来劫持的，它们的共同点是在 Web 资源传输过程或者在用户使用页面的过程中修改 Web 页面的数据。

#### 如何阻止 XSS 攻击

1. 服务器对输入脚本进行过滤或转码
2. 充分利用 CSP

- 限制加载其他域下的资源文件，这样即使黑客插入了一个 JavaScript 文件，这个 JavaScript 文件也是无法被加载的；
- 禁止向第三方域提交数据，这样用户数据也不会外泄；禁止执行内联脚本和未授权的脚本；
- 还提供了上报机制，这样可以帮助我们尽快发现有哪些 XSS 攻击，以便尽快修复问题。

3. 使用 HttpOnly 属性
   通过使用 HttpOnly 属性来保护我们 Cookie 的安全。

如图：
<img src="/img/HowBrowsersWork/http_only.webp" alt="http_only"  />

总结：
xss 攻击有三种，存储型，反射型，修改 dom 型

防范方式主要是，

1，从用户输入角度，服务器进行限制

2，从 csp，内容安全角度浏览器限制

3，限制 cookie，不能被 JavaScript 读取

## CSRF 攻击

### 什么是 CSRF 攻击

“跨站请求伪造”，是指黑客引诱用户打开黑客的网站，在黑客的网站中，利用用户的登录状态发起的跨站请求。简单来讲，CSRF 攻击就是黑客利用了用户的登录状态，并通过第三方的站点来做一些坏事。

1. 自动发起 Get 请求

```javascript
<!DOCTYPE html>
<html>
  <body>
    <h1>黑客的站点：CSRF攻击演示</h1>
    <img src="https://xxx/sendcoin?user=hacker&number=100">
  </body>
</html>
```

这是黑客页面的 HTML 代码，在这段代码中，黑客将<span style='color:red'>转账的请求接口隐藏在 img 标签内</span>，欺骗浏览器这是一张图片资源。当该页面被加载时，浏览器会自动发起 img 的资源请求，如果服务器没有对该请求做判断的话，那么服务器就会认为该请求是一个转账请求，于是用户账户上的 100 人民币就被转移到黑客的账户上去了。

2. 自动发起 POST 请求

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>黑客的站点：CSRF攻击演示</h1>
    <form id="hacker-form" action="https://淘宝/sendcoin" method="POST">
      <input type="hidden" name="user" value="hacker" />
      <input type="hidden" name="number" value="100" />
    </form>
    <script>
      document.getElementById('hacker-form').submit();
    </script>
  </body>
</html>
```

在这段代码中，我们可以看到黑客在他的页面中构建了一个隐藏的表单，该表单的内容就是 xxx 网站的转账接口。当用户打开该站点之后，这个表单会被自动执行提交；当表单被提交之后，服务器就会执行转账操作。因此使用构建自动提交表单这种方式，就可以自动实现跨站点 POST 数据提交

3. 引诱用户点击链接

```html
<div>
  <img width=150 src=http://images.xuejuzi.cn/1612/1_161230185104_1.jpg> </img> </div> <div>
  <a href="淘宝/sendcoin?user=hacker&number=100" taget="_blank">
    点击下载美女照片
  </a>
</div>
```

这段黑客站点代码，页面上放了一张美女图片，下面放了图片下载地址，而这个下载地址实际上是黑客用来转账的接口，一旦用户点击了这个链接，那么他的 💰 就被转到黑客账户上了。

以上三种就是黑客经常采用的攻击方式。如果当用户登录了淘宝，以上三种 CSRF 攻击方式中的任何一种发生时，那么服务器都会将一定金额发送到黑客账户。到这里，相信你已经知道什么是 CSRF 攻击了。和 XSS 不同的是，CSRF 攻击不需要将恶意代码注入用户的页面，仅仅是利用服务器的漏洞和用户的登录状态来实施攻击。

#### CSRF 攻击的前提

1. 目标站点一定要有 CSRF 漏洞；
2. 用户要登录过目标站点，并且在浏览器上保持有该站点的登录状态；
3. 需要用户打开一个第三方站点，可以是黑客的站点，也可以是一些论坛

##### 如何防止 CSRF 攻击

1. 充分利用好 Cookie 的 SameSite 属性，在 HTTP 响应头中，通过 set-cookie 字段设置 Cookie 时，可以带上 SameSite 选项，如下：

```javascript
set-cookie: 1P_JAR=2024-10-20-06; expires=Tue, 19-Nov-2024 06:36:21 GMT; path=/;
domain=.google.com; SameSite=none
```

SameSite 选项通常有 Strict、Lax 和 None 三个值。

- 如果 SameSite 的值是 Strict，那么浏览器会完全禁止第三方 Cookie。简言之，如果你从极客时间的页面中访问 InfoQ 的资源，而 InfoQ 的某些 Cookie 设置了 SameSite = Strict 的话，那么这些 Cookie 是不会被发送到 InfoQ 的服务器上的。只有你从 InfoQ 的站点去请求 InfoQ 的资源时，才会带上这些 Cookie。
- Lax 相对宽松一点。在跨站点的情况下，从第三方站点的链接打开和从第三方站点提交 Get 方式的表单这两种方式都会携带 Cookie。但如果在第三方站点中使用 Post 方法，或者通过 img、iframe 等标签加载的 URL，这些场景都不会携带 Cookie。
- 而如果使用 None 的话，在任何情况下都会发送 Cookie 数据。

2. 验证请求的来源站点
   Referer 是 HTTP 请求头中的一个字段，记录了该 HTTP 请求的来源地址。比如我从极客时间的官网打开了 InfoQ 的站点，那么请求头中的 Referer 值是极客时间的 URL，如下图：

<img src="/img/HowBrowsersWork/reference.webp" alt="reference"  />
虽然可以通过 Referer 告诉服务器 HTTP 请求的来源，但是有一些场景是不适合将来源 URL 暴露给服务器的，因此浏览器提供给开发者一个选项，可以不用上传 Referer 值，具体可参考 Referrer Policy。但在服务器端验证请求头中的 Referer 并不是太可靠，因此标准委员会又制定了 Origin 属性，在一些重要的场合，比如通过 XMLHttpRequest、Fecth 发起跨站请求或者通过 Post 方法发送请求时，都会带上 Origin 属性，如下图：

<img src="/img/HowBrowsersWork/origin.webp" alt="origin"  />
从上图可以看出，Origin 属性只包含了域名信息，并没有包含具体的 URL 路径，这是 Origin 和 Referer 的一个主要区别。在这里需要补充一点，Origin 的值之所以不包含详细路径信息，是有些站点因为安全考虑，不想把源站点的详细路径暴露给服务器。因此，服务器的策略是优先判断 Origin，如果请求头中没有包含 Origin 属性，再根据实际情况判断是否使用 Referer 值。

3. CSRF Token
   除了使用以上两种方式来防止 CSRF 攻击之外，还可以采用 CSRF Token 来验证，这个流程比较好理解，大致分为两步。第一步，在浏览器向服务器发起请求时，服务器生成一个 CSRF Token。CSRF Token 其实就是服务器生成的字符串，然后将该字符串植入到返回的页面中。你可以参考下面示例代码：

```html
<!DOCTYPE html>
<html>
  <body>
    <form action="https://time.geekbang.org/sendcoin" method="POST">
      <input
        type="hidden"
        name="csrf-token"
        value="nc98P987bcpncYhoadjoiydc9ajDlcn"
      />
      <input type="text" name="user" />
      <input type="text" name="number" />
      <input type="submit" />
    </form>
  </body>
</html>
```

第二步，在浏览器端如果要发起转账的请求，那么需要带上页面中的 CSRF Token，然后服务器会验证该 Token 是否合法。如果是从第三方站点发出的请求，那么将无法获取到 CSRF Token 的值，所以即使发出了请求，服务器也会因为 CSRF Token 不正确而拒绝请求。

## 安全沙箱

<img src="/img/HowBrowsersWork/安全沙箱.webp" alt="安全沙箱"  />
在多进程的基础之上引入了安全沙箱，有了安全沙箱，就可以将操作系统和渲染进程进行隔离，这样即便渲染进程由于漏洞被攻击，也不会影响到操作系统的。

由于渲染进程采用了安全沙箱，所以在渲染进程内部不能与操作系统直接交互，于是就在浏览器内核中实现了持久存储、网络访问和用户交互等一系列与操作系统交互的功能，然后通过 IPC 和渲染进程进行交互。

由于最初 chrome 都是按照标签页来划分渲染进程的，所以如果一个标签页里面有多个不同源的 iframe，那么这些 iframe 也会被分配到同一个渲染进程中，这样就很容易让黑客通过 iframe 来攻击当前渲染进程。而站点隔离会将不同源的 iframe 分配到不同的渲染进程中，这样即使黑客攻击恶意 iframe 的渲染进程，也不会影响到其他渲染进程的。
