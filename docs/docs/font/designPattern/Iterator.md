# 迭代器模式

## 什么是迭代器模式？

迭代器模式简单地说就是提供一种方法顺序访问一个聚合对象中各个元素，而又不暴露该对象的内部表示。迭代器模式解决了以下问题：

- 提供一致的遍历各种数据结构的方式，而不用了解数据的内部结构。
- 提供遍历容器（集合）的能力而无需改变容器的接口。

### 一个迭代器通常需要实现以下接口：

- hasNext()：判断迭代是否结束，返回 Boolean。
- next()：查找并返回下一个元素。

## 示例代码

### 为 JavaScript 的数组实现一个迭代器

```javascript
const item = [1, 'red', false, 3.14];

function Iterator(items) {
  this.items = items;
  this.index = 0;
}

Iterator.prototype = {
  hasNext: function () {
    return this.index < this.items.length;
  },
  next: function () {
    return this.items[this.index++];
  },
};
```

### 验证迭代器是否工作

```javascript
const iterator = new Iterator(item);

while (iterator.hasNext()) {
  console.log(iterator.next());
}
// 输出：1, red, false, 3.14
```

## ES6 中的迭代器

ES6 提供了更简单的迭代循环语法 for...of，使用该语法的前提是操作对象需要实现可迭代协议（The iterable protocol），简单说就是该对象有个 Key 为 Symbol.iterator 的方法，该方法返回一个 iterator 对象。

### 实现一个 Range 类用于在某个数字区间进行迭代

```javascript
function Range(start, end) {
  return {
    [Symbol.iterator]: function () {
      return {
        next() {
          if (start < end) {
            return { value: start++, done: false };
          }
          return { done: true, value: end };
        },
      };
    },
  };
}
```

### 验证 Range 类的迭代

```javascript
for (num of Range(1, 5)) {
  console.log(num);
}
// 输出：1, 2, 3, 4
```

## 优缺点

### 优点

- 提供了一种统一的方式来遍历不同的数据结构。
- 使得代码更加简洁和可读。

### 缺点

- 可能会增加系统的复杂性。
- 需要额外的内存来存储迭代器的状态

## 总结

迭代器模式是一种非常有用的设计模式，它提供了一种标准的方法来遍历集合，而不需要暴露集合的内部结构。通过实现迭代器，开发者可以更灵活地处理各种数据结构，提高代码的可维护性和可读性。
