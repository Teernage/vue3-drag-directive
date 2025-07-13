# 代理模式

## 什么是代理模式？

代理模式是一种结构型设计模式，它为一个对象提供一个代用品或占位符，以便控制对它的访问。代理对象可以在客户端和真实对象之间起到中介的作用，通常用于延迟加载、权限控制、日志记录等场景。

## 代理模式的实现原理

代理模式通常涉及三个角色：

- 主题（Subject）：定义真实对象和代理对象的共同接口。
- 真实主题（RealSubject）：实现了主题接口的真实对象。
- 代理（Proxy）：持有真实主题的引用，并实现主题接口，控制对真实主题的访问。

## 示例代码

### 1.小明送花的场景

在这个场景中，小明希望将花送给 A，但由于他无法判断 A 的心情，因此直接送花可能会导致花被扔掉。为了避免这种情况，小明将花交给了 B，B 负责监听 A 的心情变化，并在合适的时机将花转交给 A。

```js
let Flower = function () {};

let xiaoming = {
  sendFlower: function (target) {
    let flower = new Flower();
    target.receiveFlower(flower);
  },
};

let B = {
  receiveFlower: function (flower) {
    A.listenGoodMood(function () {
      A.receiveFlower(flower);
    });
  },
};

let A = {
  receiveFlower: function (flower) {
    console.log('收到花: ' + flower);
  },
  listenGoodMood: function (fn) {
    setTimeout(function () {
      fn();
    }, 1000);
  },
};

xiaoming.sendFlower(B);
```

- 代理对象：B 是代理对象，它控制对 A 的访问。
- 真实对象：A 是接收花的真实对象。
- 控制访问：B 通过监听 A 的心情变化，决定何时将花转交给 A，从而避免了不合时宜的送花行为。

### 2. HTML 元素事件代理

在这个示例中，使用事件代理的方式来处理点击事件。通过将事件监听器添加到父元素 ul 上，而不是每个 li 元素上，所有的点击事件都会被捕获并处理。

```html
<ul id="ul">
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>
<script>
  let ul = document.querySelector('ul');
  ul.addEventListener('click', (event) => {
    console.log(event.target);
  });
</script>
```

## 优缺点

### 优点

- 可以在不改变真实主题的情况下增加额外的功能。
- 可以控制对真实主题的访问，提供权限控制。

### 缺点

- 代理模式可能会增加系统的复杂性。
- 代理对象的存在可能会导致性能开销。

## 总结

代理模式是一种灵活的设计模式，可以在多种场景中使用，尤其是在需要控制对某些对象的访问时。通过合理使用代理模式，可以提高系统的可维护性和扩展性。
