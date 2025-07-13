# 🚨 别再乱用 will-change 了！前端翻车的"性能优化"陷阱

> 大家好，我是你们的老朋友"踩坑专业户"。今天要跟大家聊聊一个看起来很美好，用起来很要命的 CSS 属性——`will-change`。

## 🚀 开场白：will-change 是个啥？

**will-change 就像是餐厅的"预约制"：**

```css
.element {
  will-change: transform;
  /* 就像打电话给餐厅："我一会儿要来吃饭，给我留个VIP包间！" */
}
```

- 🍽️ **正常情况**：你直接去餐厅，排队等位，现点现做
- 🎩 **用了 will-change**：你提前预约，餐厅给你准备好包间、提前备菜、服务员待命

**好处**：你来了就能立马享受服务，不用等待\
**坏处**：如果你放鸽子不来，餐厅白白浪费了资源（包间空着、食材准备了、服务员干等着）

**但是！** 重点来了（敲黑板 👨‍🏫）

> ⚠️ **MDN 官方警告**：will-change 应该被视为最后的应对手段，用于解决现有的性能问题。不应该被用来预测性能问题。

翻译一下就是：**别没事儿瞎用！**

## 💥 踩坑实录一：轮播图优化引发的毛玻璃消失案

### 🎯 起因：一个看似合理的性能优化

我有个轮播图组件，图片每 3 秒自动切换，带渐隐渐显效果：

```css
.carousel-container {
  will-change: opacity; /* 因为轮播图频繁切换透明度，优化性能 */
}

.carousel-item {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.carousel-item.active {
  opacity: 1; /* 渐显效果 */
}
```

**我的想法很简单**：轮播图频繁切换透明度（渐隐渐显），加 `will-change: opacity` 可以让浏览器提前优化，避免每次切换都重新计算渲染。

### 🔍 案发现场

然后我在轮播列表中的元素加了个毛玻璃：

```html
<style>
  .background {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: -1;
    background: url('美女图片.jpg'); /* 🌸 */
  }

  .carousel-container {
    will-change: opacity; /* 🤔 为了轮播图性能优化 */
  }

  .app-item {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(30px); /* 💨 我要毛玻璃效果！ */
  }
</style>

<div class="background">这里有美女背景图</div>
<div class="carousel-container">
  <div class="carousel-item active" v-for="list in data">
    轮播列表内容
    <div class="app-item" v-for="item for list">咦？我的毛玻璃呢？😱</div>
  </div>
</div>
```

### 🤯 结果：毛玻璃效果消失了！

**发生了什么？**

想象一下这个场景：

- 美女背景图住在 1 楼
- `carousel-container`因为`will-change: opacity`，搬到了 2 楼（创建了新的层叠上下文）
- `app-item`跟着轮播容器住 2 楼
- 现在`app-item`想透过窗户玻璃看 1 楼的美女，但是在二楼不能通过窗户玻璃看到一楼的背景图

**毛玻璃**：我想看楼下的背景！
**层叠上下文**：不行！你只能模糊你们楼层的东西！
**毛玻璃**：那我的`backdrop-filter`有啥用？😭

### 💡 解决方案

✅ 方案 1：二选一，要毛玻璃的话在父元素中去除 will-change 属性

```css
/* ❌ 这样不行 - 给整个容器加 */
.carousel-container {
  will-change: opacity; /* 创建层叠上下文，隔离了背景 */
}
```

✅ 方案 2：动态开启 will-change，动画结束后及时移除

```javascript
function switchSlide(currentSlide, nextSlide) {
  // 切换时才开启优化
  currentSlide.style.willChange = 'opacity';
  nextSlide.style.willChange = 'opacity';

  // 执行切换动画...

  // 动画结束后关闭
  setTimeout(() => {
    currentSlide.style.willChange = 'auto';
    nextSlide.style.willChange = 'auto';
  }, 500);
}
```

## 🌪️ 踩坑实录二：页面的神秘空白

### 😱 恐怖现象

**给 body 加 will-change，几乎没有任何正当理由，99% 都是误用或误解**

以为只要把 `will-change` 加在 `body` 或顶级容器上， 就能让全页面的动画、滚动、过渡都变得更流畅

```javascript
onMounted(() => {
  document.body.style.setProperty('will-change', 'transform');
});
```

结果在小屏幕上横向滚动时...

**用户**：咦？右边怎么是空白的？

**我**：不可能！我明明写了内容！

**浏览器**：兄弟，你把整个 body 都提升成合成层了，我有点懵... 😵

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/0692d558e8c74d98a3143ae4c7190177~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg5LiN5LiA5qC355qE5bCR5bm0Xw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzAzNTA3OTk2MTIxODU1MSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1749892887&x-orig-sign=zxJitRDsqq5G%2FZaRNwnj%2FLcE%2B0k%3D)
![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/114f53283f9a4cf4856cdc9fc34a1a4e~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg5LiN5LiA5qC355qE5bCR5bm0Xw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzAzNTA3OTk2MTIxODU1MSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1749892887&x-orig-sign=kuvA5BHRKJ9gUhebntdnw6uRfKI%3D)

### 🤔 为什么会这样？

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/a20c063acf444b7f8d075168080485ea~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg5LiN5LiA5qC355qE5bCR5bm0Xw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzAzNTA3OTk2MTIxODU1MSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1749892887&x-orig-sign=o7xPQypiAThsynun1D17HRd76Cw%3D)
把`body`设置`will-change`就像是：

    正常情况：
    🏠 房子里有各种家具，井井有条

    加了will-change后：
    🚁 把整个房子吊起来了，家具都飞了...

浏览器：我本来渲染得好好的，你突然让我把整个页面当作一个图层处理，我计算布局都乱了！

### 💊 治疗方案

```javascript
// ❌ 别这样做
document.body.style.setProperty('will-change', 'transform');

// ✅ 删掉就好了
```

## 🎯 will-change 使用指南（避坑版）

### ❌ 错误示范

### 1. **不要滥用**

- ❌ **全局加**：`* { will-change: transform; }`  绝对不可取，会让浏览器资源爆炸。
- ❌ **长期挂着**：动画结束后不移除，长期占用 GPU，影响性能。
- ❌ **预测性优化**：不确定会不会动画就加，得不偿失。
- ❌ **容器乱加**：只给需要动画的元素加，不要给大容器加。

### ✅ 正确姿势

- ✅ **提前加**：动画或变换**发生前**加上 will-change，给浏览器准备时间（一般提前 2 个 requestAnimationFrame 或 300ms）。
- ✅ **及时移除**：动画或变换结束后，立刻移除 will-change（`will-change: auto`），释放资源。
- ✅ **持续动画场景可以一直加**：比如一直旋转的 loading 图标。

## 🏆 总结：will-change 的人生哲理

1.  **🎭 不要装逼**：没有性能问题就别用
2.  **⏰ 用完就走**：开启后记得关闭
3.  **🎯 精准打击**：只给真正需要的元素用，别给容器瞎加
4.  **🚫 不要贪心**：别给太多元素同时用
5.  **🔍 提前规划**：动画开始前开启，结束后关闭
6.  **🏠 考虑副作用**：层叠上下文的改变可能影响其他 CSS 效果（比如毛玻璃）

## 🎪 最后的彩蛋

记住这个口诀：

> **will-change 不是万能药，**\
> **用错了比不用更糟糕。**\
> **GPU 虽好莫贪杯，**\
> **用完记得要回收！**\
> **性能优化要精准，**\
> **副作用也要防！** 🎵

**特别提醒**：当你为了优化性能而添加`will-change`时，一定要测试页面的其他功能是否正常，特别是：

- 毛玻璃效果（`backdrop-filter`）
- 层叠顺序（`z-index`）
- 定位效果（`position`相关）
- 其他依赖层叠上下文的效果

---

**各位前端 er 们，你们踩过`will-change`的坑吗？评论区分享一下你们的"血泪史"吧！** 😄

_记得点赞 👍 收藏 ⭐ 分享 📤 三连哦\~_

---

_本文由"踩坑专业户"原创，转载请注明出处。更多踩坑经验，敬请期待下期分解！_
