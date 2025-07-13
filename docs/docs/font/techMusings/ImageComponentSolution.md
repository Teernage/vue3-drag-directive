# 🚀 前端图片组件崩溃、乱序、加载失败？一套队列机制+多级兜底全搞定

> ⚠️ **环境要求说明** > > - 本文部分代码（如 `faviconURL` 方法、`chrome.runtime.getURL` 等）仅适用于 Chrome 扩展（插件）环境。 > - 如果你在普通网页项目中使用，将无法获取 favicon，建议使用公开 favicon 服务（如 `https://www.google.com/s2/favicons?domain=xxx.com`）。

**你是否遇到过头像组件加载慢、频繁切换联系人时头像显示错乱的尴尬？本篇带你拆解一个“稳如老狗”的头像组件，核心亮点就在于——用队列串行机制，优雅消灭异步竞态问题，让多级兜底（图片、favicon、首字母）始终有序、永不穿越！**

> “头像图片又挂了？别慌，咱有 Plan B、Plan C、Plan D！”

## 🎯 需求背景

头像组件的常见痛点：

- 图片地址失效，变成尴尬的叉叉
- 有些站点 favicon，浏览器给你返回个地球图标（默认图标），毫无辨识度
- 没图也没 favicon？那就干脆显示首字母吧

我们的目标就是——**无论发生什么，头像都得有内容！**

---

## 🏗️ 组件结构

```
<template>
  <!-- 能显示图片就显示图片 -->
  <img v-if="shouldShowImage" ... />
  <!-- 否则显示自定义图标（首字母背景） -->
  <div v-else class="custom-icon" :style="...">
    {{ getText }}
  </div>
</template>
```

是不是很直观？下面是核心 JS 逻辑。

---

## 🧠 智能加载与兜底机制

### 1. 主流程：优先级三连跳

1.  **优先加载传入的图片 URL**能用就用，不能用就想办法兜底。

2.  **图片挂了？那就去 Chrome 浏览器 要 缓存过的站点 favicon (只要浏览器访问过那个站点，通常浏览器都会保存该站点的 favicon)，** 咱直接拿来用！

3.  **favicon 还是失败？那就显示首字母和相应的背景色** 总不能让用户看到一片空白吧，至少得有个字母撑场面。

---

### 2. 判断 favicon 是不是“地球”

有些网站没 favicon 或者 favicon 资源加载失败，Chrome 会给你个地球图标。我们用 SHA-256 算法，把图片内容哈希一下，和已知的“地球”哈希值对比。**一旦发现是地球，立刻切换 Plan C！**

#### 🚥 如何将图片内容哈希化？

有些朋友可能会好奇：“你说用 SHA-256 算法判断 favicon 是不是 Chrome 的‘地球’，那图片怎么变成哈希值呢？”

其实很简单，前端用原生 API 就能搞定：

1.  **获取图片的 ArrayBuffer**先用 `fetch` 拉图片资源，拿到二进制数据。

2.  **用** **`crypto.subtle.digest`** **计算哈希**浏览器原生支持 SHA-256 等多种哈希算法。

3.  **把哈希转成十六进制字符串**方便和已知的“地球”哈希比对。

完整代码如下：

```
async function getImageHash(url) {
  // 1. 拉取图片资源
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  // 2. 计算哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  // 3. 转成十六进制字符串
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}
```

**用途举例：**

```
const defaultImageHashes = new Set([
  'b30d0997...bf74', // 地球图标的哈希
  'e5c321f5...cd5b'
])

const hash = await getImageHash(faviconUrl)
if (defaultImageHashes.has(hash)) {
  // 是“地球”图标，直接兜底用首字母
  showDefaultIcon()
}
```

这样，判断“是不是地球”就变得科学又精准啦！

---

### 3. 图片加载加速&缓存

- 每次加载图片前，先查缓存，没变就不重复加载。
- 加载图片有超时机制，3 秒还没加载出来，直接兜底。

---

### 🌟 图片加载加速&缓存代码示例

```
// 简单图片缓存，key 为图片URL，value 为加载结果（true/false 或图片对象）
const imageCache = new Map()

/**
 * 加载图片并缓存，支持超时兜底
 * @param {string} url 图片地址
 * @param {number} timeout 超时时间（毫秒），默认 3000
 * @returns {Promise<boolean>} 是否加载成功
 */
function loadImageWithCache(url, timeout = 3000) {
  // 已缓存且加载成功，直接返回
  if (imageCache.has(url) && imageCache.get(url) === true) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const img = new window.Image()

    let timer = setTimeout(() => {
      img.src = '' // 触发 onerror，防止图片继续加载
      imageCache.set(url, false)
      resolve(false) // 超时兜底
    }, timeout)

    img.onload = () => {
      clearTimeout(timer)
      imageCache.set(url, true)
      resolve(true)
    }

    img.onerror = () => {
      clearTimeout(timer)
      imageCache.set(url, false)
      resolve(false)
    }

    img.src = url
  })
}
```

#### **使用示例**

```
const url = 'https://example.com/avatar.jpg'
const isLoaded = await loadImageWithCache(url, 3000)
if (isLoaded) {
  // 显示图片
} else {
  // 走兜底逻辑（favicon 或首字母）
}
```

### **要点说明**

- **缓存加速**：同一个图片 URL，只要加载成功一次，后续都直接命中缓存，不重复发请求。
- **超时兜底**：3 秒没加载出来，立刻走兜底逻辑
- **灵活扩展**：你可以把 `imageCache` 做成更复杂的 LRU 缓存，甚至支持失效时间。

## 🎨 颜色算法：首字母也能有高级感

你以为首字母背景色是随意挑的吗？其实背后有一套“**名字转彩虹**”算法！

```
const colorArr = [
  '#FF9C40', '#FF4040', '#F5CC3D', '#68C331', '#33CBA6',
  '#32C9C9', '#3AA8E5', '#5C6AE5', '#995CE6', '#E55CBF'
]

// 通过名字生成一个稳定的下标
function stringToNumberMod(str) {
  let sum = 0
  for (let index = 0; index < str.length; index++) {
    sum += str[index].charCodeAt(0)
  }
  return sum % colorArr.length
}

// 支持多种颜色格式
function getColorFromName(name, format = 'hex') {
  if (!name) return

  const index = stringToNumberMod(name)
  const hexColor = colorArr[index]

  if (format === 'hexAlpha') {
    // hex转hex+透明度
    return `${hexColor.replace('#', '')}FF`
  } else if (format === 'rgba') {
    // hex转rgba
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 1)`
  }

  return hexColor
}
```

**小结：**

同一个名字，永远是同一个颜色。再也不用担心“今天红，明天绿，后天变彩虹”啦！

---

## ⚡ 队列机制&超时兜底：让每次变脸都井井有条

说到这里，聪明的你可能会问：“那如果用户手速如飞，疯狂切换联系人，头像会不会乱套？”

别怕，我们有**队列机制**来兜底！

### 为什么不直接取消上一个请求？

- Chrome 拿 favicon 是浏览器异步的，没法中途取消。
- Chrome 有时候响应慢，如果不控制，慢请求可能会覆盖新头像，出现“穿越”现象！

所以我们采用**队列机制**：

每次有新任务（比如 url 变了），就把任务塞进队列。如果当前没人处理队列，就启动一个“处理员”，顺序执行队列里的每个任务，保证同一时刻只处理一个。这样无论遇到多激烈的“变脸”场景，头像组件都能稳稳当当、井井有条！

### Chrome favicon 也不会“死等”！

更机智的是，我们**不会一直傻等 Chrome**。

毕竟头像不能一直空着等“慢快递”，**如果等了 2 秒还没回来，组件就会自动放弃 Chrome，直接执行第三套策略——用首字母顶上！** **之所以只给 2 秒超时，是因为从浏览器本地拿 favicon 资源，本质是本地 IO 操作，不需要走网络，一般来说响应非常快。如果 2 秒还没拿到，说明浏览器响应异常或资源不存在，直接兜底更合理。**

这样用户永远不会看到“加载中”的尴尬

```
async function loadChromeFavicon(timeout = 2000) {
  if (!props.chromeImgUrl) {
    showDefaultIcon()
    return
  }

  const faviconUrl = faviconURL(props.chromeImgUrl)
  try {
    // 超时 Promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('favicon timeout')), timeout)
    )
    // fetch+超时“竞速”
    const response = await Promise.race([
      fetch(faviconUrl),
      timeoutPromise
    ])
    if (!response.ok) throw new Error('Failed to fetch favicon')

    const arrayBuffer = await response.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (defaultImageHashes.has(hashHex)) {
      throw new Error('Default favicon detected')
    }

    currentSrc.value = faviconUrl
    shouldShowImage.value = true
  } catch (error) {
    // 只在非预期错误时打印日志
    if (!(error instanceof Error && (error.message === 'Failed to fetch favicon' || error.message === 'favicon timeout'))) {
      console.error('Unexpected error while loading favicon:', error)
    }
    showDefaultIcon()
  }
}
```

#### 队列机制核心代码：

```
let initQueue = []
let isProcessingQueue = false

async function init() {
  // 新任务入队
  const currentInitTask = async () => {
    await loadUrlImage(props.url)
  }
  initQueue.push(currentInitTask)

  // 如果已经有处理员在干活，就不重复启动
  if (isProcessingQueue) return

  isProcessingQueue = true
  handleTask()
}

async function handleTask() {
  while (initQueue.length > 0) {
    try {
      const task = initQueue.shift()
      await task()
    } catch (error) {
      console.log(error)
    }
  }
  isProcessingQueue = false
}

// favicon 超时兜底
async function loadChromeFaviconWithTimeout(url, timeout = 10000) {
  return Promise.race([
    loadChromeFavicon(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ])
}
```

**一句话总结：**

与其让慢吞吞的 Chrome 请求到处乱撞，不如让它乖乖排队；

与其死等 Chrome 响应，不如有超时兜底，保证用户永远看到最新、最靠谱的头像！

这才是前端的温柔与秩序～

---

## 🤡 代码片段赏析

#### 图片加载失败的终极兜底

```
async function handleError() {
  if (props.chromeImgUrl && !isDevelopment) {
    await loadChromeFaviconWithTimeout(props.url)
  } else {
    showDefaultIcon()
  }
}
```

#### Chrome favicon 获取方式

```
function faviconURL(webUrl) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', webUrl)
  url.searchParams.set('size', '64')
  return url.toString()
}
```

#### 哈希判重，识别“地球”

```
const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
const hashHex = Array.from(new Uint8Array(hashBuffer))
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('')
if (defaultImageHashes.has(hashHex)) {
  throw new Error('Default favicon detected')
}
```

---

## 完整代码：

vue 组件实现

```vue
<template>
  <img
    v-if="shouldShowImage"
    ref="imgRef"
    class="img"
    :src="currentSrc"
    :alt="alt"
    @error="handleError"
  />
  <div
    v-else
    class="custom-icon"
    :style="{
      background: normalBg,
      color: 'white',
    }"
  >
    {{ getText }}
  </div>
</template>

<script setup lang="ts">
import getAvatarBgColor from '@/util/getColorFromString';
import { computed, ref, watch } from 'vue';
import { useImageCacheStore } from '@/store/imageCache';

const props = defineProps({
  url: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    required: true,
  },
  normalImgText: {
    type: String,
    required: true,
  },
  chromeImgUrl: {
    type: String,
    required: true,
  },
});

const getText = computed(() => {
  if (!props.normalImgText) return;
  return String.fromCodePoint(
    props.normalImgText.codePointAt(0)
  ).toLocaleUpperCase();
});

const isDevelopment = import.meta.env.MODE === 'development';

const imgRef = ref(null);
const currentSrc = ref('');
const shouldShowImage = ref(false);
const normalBg = ref('');

let initQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

const defaultImageHashes = new Set([
  'b30d09971d9432210b53e9bad586a6592e893d06656748c21192052c9602bf74',
  'e5c321f52e7ee479ff191fa75c6b6fd91ee41393b5ca62b6a7d4f1a2b784cd5b',
]);

const imageCache = useImageCacheStore();

async function loadImageWithTimeout(
  url: string,
  timeout = 10000
): Promise<void> {
  // 检查缓存
  if (imageCache.hasImageCache(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    let timer: number | null = null;

    const cleanUp = () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanUp();
      imageCache.setImageCache(url); // 将图片URL添加到pinia缓存中
      resolve();
    };

    img.onerror = () => {
      cleanUp();
      reject(new Error('Image load error'));
    };

    timer = setTimeout(() => {
      cleanUp();
      reject(new Error('Image load timeout'));
    }, timeout) as unknown as number;

    img.src = url;
  });
}

/**
 * 异步加载 Chrome 浏览器图标
 *
 * @param timeout 超时时间，默认为 3000 毫秒
 * @returns 无返回值
 */
async function loadChromeFavicon(timeout = 3000) {
  if (!props.chromeImgUrl) {
    showDefaultIcon();
    return;
  }

  const faviconUrl = faviconURL(props.chromeImgUrl);
  try {
    // 超时 Promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('favicon timeout')), timeout)
    );
    // fetch+超时“竞速”
    const response = await Promise.race([fetch(faviconUrl), timeoutPromise]);
    if (!response.ok) throw new Error('Failed to fetch favicon');

    const arrayBuffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (defaultImageHashes.has(hashHex)) {
      throw new Error('Default favicon detected');
    }

    currentSrc.value = faviconUrl;
    shouldShowImage.value = true;
  } catch (error) {
    // 只在非预期错误时打印日志
    if (
      !(
        error instanceof Error &&
        (error.message === 'Failed to fetch favicon' ||
          error.message === 'favicon timeout')
      )
    ) {
      console.error('Unexpected error while loading favicon:', error);
    }
    showDefaultIcon();
  }
}

/**
 * 根据网站url获取对应浏览器缓存的网站图标的URL
 *
 * @param webUrl 要获取favicon的网页URL
 * @returns 返回指定网页的favicon URL
 */
function faviconURL(webUrl: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', webUrl);
  url.searchParams.set('size', '64');
  return url.toString();
}

/**
 * 处理错误情况的异步函数
 *
 * @async
 */
async function handleError() {
  if (props.chromeImgUrl && !isDevelopment) {
    await loadChromeFavicon();
  } else {
    showDefaultIcon();
  }
}

/**
 * 显示默认图标
 *
 * @returns 无返回值
 */
function showDefaultIcon() {
  shouldShowImage.value = false;
  if (!normalBg.value) {
    normalBg.value = getAvatarBgColor(props.alt);
  }
}

/**
 * 异步加载图片资源
 *
 * @param url 图片资源的URL
 */
async function loadUrlImage(url: string) {
  if (url && url !== 'normal') {
    try {
      await loadImageWithTimeout(url);
      currentSrc.value = url;
      shouldShowImage.value = true;
      return;
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }
  await handleFallbackImage();
}

/**
 * 处理备用图片的函数
 *
 * @returns {Promise<void>} 返回一个Promise对象，无返回值
 */
async function handleFallbackImage() {
  if (props.chromeImgUrl && !isDevelopment) {
    await loadChromeFavicon();
  } else {
    showDefaultIcon();
  }
}

/**
 * 初始化函数
 *
 * 该函数负责初始化过程，包括加载图片URL并处理初始化队列。
 */
async function init() {
  const currentInitTask = async () => {
    // 加载图片URL
    await loadUrlImage(props.url);
  };

  // 将当前初始化任务添加到初始化队列中
  initQueue.push(currentInitTask);

  // 如果队列正在处理中，则直接返回
  if (isProcessingQueue) {
    // 如果队列正在处理中，直接返回
    return;
  }

  // 设置队列正在处理状态
  isProcessingQueue = true;
  handleTask();
}

/**
 * 处理任务队列
 *
 * 循环处理队列中的任务，直到队列为空
 */
async function handleTask() {
  // 循环处理队列中的任务，直到队列为空
  while (initQueue.length > 0) {
    try {
      // 取出队头任务: 图片资源请求task
      const task = initQueue.shift();
      await task();
    } catch (error) {
      console.log(error);
    }
  }
  isProcessingQueue = false;
}

watch(
  () => props.url,
  () => {
    init();
  },
  { immediate: true }
);
</script>

<style scoped>
.img {
  object-fit: cover;
  user-select: none;
  width: 100%;
  height: 100%;
}
.custom-icon {
  user-select: none;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
</style>
```

## 🥳 总结

这个组件的思路其实很简单：

- **能用图片就用图片**
- **不能用就找 favicon**
- **还不行就用首字母撑场面**
- **颜色算法保证风格统一，队列机制保证状态稳定，超时机制保证永不卡壳**
- **哈希算法让兜底逻辑更智能**

你要是还在为破图发愁，不妨把这个思路抄回去，分分钟让你的前端页面颜值爆表！

---

**前端的世界需要更多“兜底”与温柔，别让用户看到尴尬的叉叉啦！**

---
