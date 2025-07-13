# 浏览器中的 js 执行机制

## 变量提升

#### JavaScript 代码执行过程中的变量提升机制

- JavaScript 代码执行过程中，需要先做变量提升，而之所以需要实现变量提升，是因为 JavaScript 代码在执行之前需要先编译。
- 在<span style='color:red'>编译</span>阶段，变量和函数会被存放到变量环境中，变量的默认值会被设置为 undefined；
- 在代码<span style='color:red'>执行</span>阶段，JavaScript 引擎会从变量环境中去查找自定义的变量和函数。
- 如果在编译阶段，存在两个相同的函数，那么最终存放在变量环境中的是最后定义的那个，这是因为后定义的会覆盖掉之前定义的。
- JavaScript 的执行机制：<span style='color:red'>先编译，再执行</span>。

#### head 头部引入的 js 文件，也是先编译的吗？

html 文件在被加载下来的时候就会进行 dom 解析了，解析过程遇到 script 标签的话就会下载对应的脚本，然后编译脚本，编译完之后就执行脚本，执行完脚本之后继续 dom 解析

## 调用栈

- 每调用一个函数，JavaScript 引擎会为其创建执行上下文，并把该执行上下文压入调用栈，然后 JavaScript 引擎开始执行函数代码。
- 如果在一个函数 A 中调用了另外一个函数 B，那么 JavaScript 引擎会为 B 函数创建执行上下文，并将 B 函数的执行上下文压入栈顶。
- 当前函数执行完毕后，JavaScript 引擎会将该函数的执行上下文弹出栈。
- 当分配的调用栈空间被占满时，会引发“堆栈溢出”问题。

## 块级作用域

下面这段代码输出的结果是？

```javascript
{
  let myname = '不一样的少年';
  {
    console.log(myname);
    let myname = '不一样的少年';
  }
}
```

### 最终打印结果分析与拓展

**最终打印结果**：`VM6277:3 Uncaught ReferenceError: Cannot access 'myname' before initialization`

**分析原因**：在块作用域内，使用 `let` 声明的变量被提升，但只有变量的创建被提升，初始化并没有被提升。因此，在初始化之前使用变量会导致暂时性死区错误。

**拓展**：

- `var` 的创建和初始化会被提升，但赋值不会被提升。因此，可以在初始化之前访问到 `var` 声明的变量，其值为 `undefined`。
- `let` 的创建被提升，但初始化和赋值不会被提升。在初始化之前使用 `let` 声明的变量会引发暂时性死区错误。
- `function` 的创建、初始化和赋值均会被提升。

### 案例：

```javascript
function foo() {
  var a = 1;
  let b = 2;
  {
    let b = 3;
    var c = 4;
    let d = 5;
    console.log(a);
    console.log(b);
  }
  console.log(b);
  console.log(c);
  console.log(d);
}
foo();
```

1. **编译并创建执行上下文**：

   - `var` 声明的变量提升至变量环境中，而 `let` 和 `const` 声明的变量则提升至词法环境中。
   - 在函数作用域块内部，通过 `let` 声明的变量并未存放在词法环境中，如下图所示的块级作用域中的 `b` 和 `d`。

   <img src="/img/HowBrowsersWork/3.png" alt="编译并创建执行上下文"  />

2. **继续执行代码**：

   - 变量环境中的 `a` 被赋值为 `1`，词法环境中的 `b` 被赋值为 `2`。
   - 执行到块级作用域中，`b` 被赋值为 `3`，`c` 被赋值为 `4`，`d` 被赋值为 `5`。
     <img src="/img/HowBrowsersWork/4.png" alt="编译并创建执行上下文"  />

3. **日志打印的词法环境查询**：
   - 沿着词法环境的栈顶向下查询，在块级作用域内查找变量。如果找到则返回给 JavaScript 引擎，否则继续在变量环境中查找。
     <img src="/img/HowBrowsersWork/2.png" alt="编译并创建执行上下文"  />

输出结果如下：

- `a` 为 `1`
- 第一个块级作用域中的 `b` 为 `3`

4. **块级作用域执行完毕后的上下文**：
   - 当块级作用域执行完毕后，上下文将被弹出栈，`foo` 函数的执行上下文变为下图所示。
     <img src="/img/HowBrowsersWork/1.png" alt="编译并创建执行上下文"  />

继续输出以下日志：

- `b` 为 `2`
- `c` 为 `4`
- `d`：`d is not defined`

## 作用域

```javascript
var bar = {
  myName: 'time.geekbang.com',
  printName: function () {
    console.log(myName);
  },
};
function foo() {
  let myName = '极客时间';
  return bar.printName;
}
let myName = '极客邦';
let _printName = foo();
_printName();
bar.printName();
```

打印结果：

- `_printName` 函数调用的结果是 “极客邦”
- `bar.printName()` 调用的结果也是 “极客邦”

### 解析

1. `let _printName = foo()` foo 函数返回的是 bar 对象中的 printName 方法，所以此时\_printName 就是 printName 方法。

   ```javascript
   let _printName = function () {
     console.log(myName);
   };
   ```

   执行\_printName 函数，此时\_printName 函数定义的位置是在全局作用域，所以执行\_printName 函数时，打印输出 myName 值，函数作用域内没有，则向外找，向外找就是全局作用域，即"极客邦"。

2. 执行`bar.printName()`，此时执行的是 bar 对象中的 printName 函数，此时打印 myName 变量，在局部函数作用域内依然是找不到的，所以此时会向外找，所以找的还是全局作用域内的 myName 变量，myName 的值是“极客邦”。

如果要输出以下这个 time.geekbang.com 的话，则需要打印 bar.myName

### 作用域链

```javascript
function bar() {
  console.log(myName);
}
function foo() {
  var myName = '极客邦';
  bar();
}
var myName = '极客时间';
foo();
```

当一段代码使用了一个变量时，JavaScript 引擎首先会在“当前的执行上下文”中查找该变量，比如上面那段代码在查找 myName 变量时，如果在当前的变量环境中没有查找到，那么 JavaScript 引擎会继续在 outer 所指向的执行上下文中查找。为了直观理解，你可以看下面这张图：

<img src="/img/HowBrowsersWork/6.png" alt="作用域链"  />

从图中可以看出，bar 函数和 foo 函数的 outer 都是指向全局上下文的，这也就意味着如果在 bar 函数或者 foo 函数中使用了外部变量，那么 JavaScript 引擎会去全局执行上下文中查找。我们把这个查找的链条就称为作用域链。
JavaScript 执行过程中，其作用域链是由<span style='color:red'>词法作用域</span>决定的。

### 词法作用域

<span style='color:red'>词法作用域</span>就是指作用域是由代码中<span style='color:red'>函数声明的位置</span>来决定的，所以词法作用域是静态的作用域，通过它就能够预测代码在执行过程中如何查找标识符。

例如：
<img src="/img/HowBrowsersWork/5.png" alt="作用域链"  />
整个词法作用域链的顺序是：foo 函数作用域—>bar 函数作用域—>main 函数作用域—> 全局作用域。

- 词法作用域是代码编译阶段就决定好的，和函数是怎么调用的没有关系。所以词法作用域只跟函数定义的位置有关，与函数调用无关

## 闭包

<span style='color:orange;font-weight:bold'>闭包定义</span>：
在 JavaScript 中，根据词法作用域的规则，内部函数总是可以访问其外部函数中声明的变量，当通过调用一个外部函数返回一个内部函数后，即使该外部函数已经执行结束了，但是内部函数引用外部函数的变量依然保存在内存中，我们就把这些变量的集合称为闭包。

### 注意事项

闭包如果存在太多的话，就会导致内存泄漏，所以在编写代码的时候需要注意。

### 例子

```javascript
function foo() {
  var myName = '极客时间';
  let test1 = 1;
  const test2 = 2;
  var innerBar = {
    getName: function () {
      console.log(test1);
      return myName;
    },
    setName: function (newName) {
      myName = newName;
    },
  };
  return innerBar;
}
var bar = foo();
bar.setName('极客邦');
bar.getName();
console.log(bar.getName());
```

首先我们看看当执行到 foo 函数内部的 return innerBar 这行代码时调用栈的情况，你可以参考下图：
<img src="/img/HowBrowsersWork/7.png" alt="闭包"  />

当代码执行到 bar.getName()的时候，此时内部的 test2 变量和 test1 变量都被引用了，所以即使 foo 函数执行完毕，这两个变量依然不会被垃圾回收机制收回。
当 foo 函数执行完毕之后调用栈如下图所示：
<img src="/img/HowBrowsersWork/8.png" alt="闭包"  />

无论在哪里调用了 setName 和 getName 方法，它们都会背着这个 foo 函数的专属背包。除了 setName 和 getName 方法，其他任何地方都无法访问这个专属背包，所以称为 foo 函数的闭包

## js 执行上下文中的 this

- 当函数作为对象的方法调用时，函数中的 this 就是该对象；
- 当函数被正常调用时，在严格模式下，this 值是 undefined，非严格模式下 this 指向的是全局对象 window；
- 嵌套函数中的 this 不会继承外层函数的 this 值。（除了箭头函数，因为箭头函数没有自己的执行上下文，所以箭头函数的 this 就是它外层函数的 this）
- 点击事件 比如给一个 button 对象绑定点击事件 事件句柄中的 this 就是 button 对象

#### 例 1:

```javascript
let userInfo = {
  name: 'jack.ma',
  age: 13,
  sex: male,
  updateInfo: function () {
    //模拟xmlhttprequest请求延时
    setTimeout(function () {
      this.name = 'pony.ma';
      this.age = 39;
      this.sex = female;
    }, 100);
  },
};

userInfo.updateInfo();
```

#### 使 this 是 userInfo 对象的方式有哪些？

1.  改为箭头函数，箭头函数没有自己的执行上下文，所以会取外层的 this，外层的 this 指向的是 userInfo 对象

```javascript
setTimeout(() => {
  this.name = 'pony.ma';
  this.age = 39;
  this.sex = female;
}, 100);
```

2.用 self 缓存外层的 this

```javascript
  updateInfo:function(){
    //模拟xmlhttprequest请求延时
    var self = this
    setTimeout(function(){
      self.name = "pony.ma"
      self.age = 39
      self.sex = female
    },100)
  }
```

3. bind 方法改变 this

```javascript
 updateInfo:function(){
    //模拟xmlhttprequest请求延时
    const fn = function(){
      this.name = "pony.ma"
      this.age = 39
      this.sex = female
    }
    setTimeout(fn.bind(this),100)
  }
```

4. call 或 apply 方法改变 this

```javascript
let userInfo = {
  name: 'jack.ma',
  age: 13,
  sex: male,
  updateInfo: function () {
    //模拟xmlhttprequest请求延时
    setTimeout(function () {
      (function () {
        this.name = 'pony.ma';
        this.age = 39;
        this.sex = female;
      }).call(userInfo); // .apply()
    }, 100);
  },
};

userInfo.updateInfo();
```

### 例 2

```javascript
function foo() {
  console.log(this); // obj1对象
}

var obj1 = {
  name: 'obj1',
  foo: foo,
};

var obj2 = {
  name: 'obj2',
  obj1: obj1,
};

obj2.obj1.foo();
```

- 我们通过 obj2 又引用了 obj1 对象，再通过 obj1 对象调用 foo 函数；
- 那么 foo 调用的位置上其实还是 obj1 被绑定了 this；

### 例 3

```javascript
function foo() {
  console.log(this);
}

var obj1 = {
  name: 'obj1',
  foo: foo,
};

// 讲obj1的foo赋值给bar
var bar = obj1.foo;
bar();
```

- 此时的 this 是 window 隐式丢失,如果是 obj1.foo()直接调用的话，this 就是 obj1

- 但是此时是 obj1.foo 赋值给 bar 变量 bar 变量再调用，this 是运行时绑定，所以此时调用的位置是全局直接调用，没有绑定任何对象，所以 this 是默认绑定，即指向的是 window

## this 总结

- new 绑定 > 显式绑定（bind）> 隐式绑定 > 默认绑定
- new 不能和 call 和 apply 同时用

- 隐式绑定 obj.fn fn 函数中的 this 变成了 obj 对象 此 this 绑定过程为隐式绑定
- 显式绑定 fn.call(对象) fn.apply(对象) fn.bind(对象)
- 默认绑定 window

<span style='color:red;font-weight:bold'>this 是运行时的行为，this 指向什么，完全取决于函数调用时的上下文环境 </span>

- 1.函数在调用时，JavaScript 会默认给 this 绑定一个值；
- 2.this 的绑定和定义的位置（编写的位置）没有关系；
- 3.this 的绑定和调用方式以及调用的位置有关系；
- 4.this 是在运行时被绑定的；

##### new 绑定优先级大于隐式绑定

```javascript
function foo() {
  console.log(this);
}

var obj = {
  name: 'why',
  foo: foo,
};

new obj.foo(); // foo对象, 说明new绑定优先级更高
```

##### 显式绑定优先级高于隐式绑定

```javascript
function foo() {
  console.log(this);
}

var obj1 = {
  name: 'obj1',
  foo: foo,
};

var obj2 = {
  name: 'obj2',
  foo: foo,
};

// 隐式绑定
obj1.foo(); // obj1
obj2.foo(); // obj2

// 隐式绑定和显式绑定同时存在
obj1.foo.call(obj2); // obj2, 说明显式绑定优先级更高
```

## this 规则之外

### 忽略显式绑定

如果在显式绑定中，我们传入一个 null 或者 undefined，那么这个显式绑定会被忽略，使用默认规则：

```javascript
function foo() {
  console.log(this);
}

var obj = {
  name: 'why',
};

foo.call(obj); // obj对象
foo.call(null); // window
foo.call(undefined); // window

var bar = foo.bind(null);
bar(); // window
```

### 间接函数引用

#### 例 1:

```javascript
var num1 = 100;
var num2 = 0;
var result = (num2 = num1);
console.log(result); // 100
```

- (num2 = num1)的结果是 num1 的值；

#### 例 2:

```javascript
function foo() {
  console.log(this);
}

var obj1 = {
  name: 'obj1',
  foo: foo,
};

var obj2 = {
  name: 'obj2',
};

obj1.foo(); // obj1对象
(obj2.foo = obj1.foo)(); // window
```

- 赋值(obj2.foo = obj1.foo)的结果是 foo 函数；

1. obj2.foo = obj1.foo：这行代码将 obj1 对象上的 foo 方法赋值给了 obj2.foo。此时，obj2.foo 指向了与 obj1.foo 相同的函数引用。
2. (obj2.foo)()：紧接着，使用圆括号调用了 obj2.foo。由于这个调用不是通过 obj2 对象来调用的（即不是使用 . 操作符），而是直接调用了 obj2.foo 这个函数引用，所以 this 的值在这个调用上下文中不会指向 obj2，指向的是 window。

### ES6 箭头函数中的 this

```javascript
var obj = {
  data: [],
  getData: () => {
    setTimeout(() => {
      console.log(this); // window
    }, 1000);
  },
};

obj.getData();
```

this 指向的是 window，因为定时器中用的是箭头函数，没有自己的执行上下文，所以向外找，外层的 getData 函数也是箭头函数，也没有自己的执行上下文，所以继续往外找，就是全局作用域，所以 this 指向的是 window，如果 getData 方法是普通方法的话，this 指向的是 obj

### 一些例子:

- 例 1：

```javascript
var name = 'window';
var person = {
  name: 'person',
  sayName: function () {
    console.log(this.name);
  },
};
function sayName() {
  var sss = person.sayName;
  sss(); //
  person.sayName();
  person.sayName();
  (b = person.sayName)();
}
sayName();
```

解析：

```javascript
function sayName() {
  var sss = person.sayName;
  // 独立函数调用，没有和任何对象关联
  sss(); // window
  // 关联
  person.sayName(); // person
  person.sayName(); // person
  (b = person.sayName)(); // window
}
```

在 `(person.sayName)()`; 这个表达式中，`(person.sayName)` 将 person.sayName 函数对象包裹在括号中，然后立即执行 ()。
在 JavaScript 中，当一个函数被作为对象的方法调用时，函数内部的 this 指向调用该方法的对象。因此，当执行 `(person.sayName)()` 时，`person.sayName` 被作为 person 对象的方法调用，this 指向的是 person 对象。
另一方面，当一个函数被直接调用时，函数内部的 this 指向全局对象（在浏览器中是 window 对象）。在 `sss()` 和 `(b = person.sayName)()` 中，函数 sss 和 b 被直接调用，因此 this 指向的是全局对象 window。
所以，在 `sayName()` 函数中，`(person.sayName)()` 的 this 指向 person 对象，而其他两个调用的 this 指向全局对象 window。

例 2:

```javascript
var name = 'window';
var person1 = {
  name: 'person1',
  foo1: function () {
    console.log(this.name);
  },
  foo2: () => console.log(this.name),
  foo3: function () {
    return function () {
      console.log(this.name);
    };
  },
  foo4: function () {
    return () => {
      console.log(this.name);
    };
  },
};

var person2 = { name: 'person2' };

person1.foo1();
person1.foo1.call(person2);
person1.foo2();
person1.foo2.call(person2);

person1.foo3()();
person1.foo3.call(person2)();
person1.foo3().call(person2);

person1.foo4()();
person1.foo4.call(person2)();
person1.foo4().call(person2);
```

解析：

```javascript
// 隐式绑定，肯定是person1
person1.foo1(); // person1

// 隐式绑定和显式绑定的结合，显式绑定生效，所以是person2
person1.foo1.call(person2); // person2

/** 
 foo2是一个箭头函数，不适用于所有的规则，则根据作用域链往外找，
即window 
*/
person1.foo2(); // window

// foo2是箭头函数，不适用所有的显式绑定规则，所以call无效，向作用域外找
person1.foo2.call(person2); // window

// 获取foo3，但是调用位置是全局作用域下的，所以默认绑定的是window
person1.foo3()(); // window

// foo3显式绑定到person2中，但是拿到返回函数依然是在全局下调用，所以依然是window
person1.foo3.call(person2)(); // window

// 拿到foo3返回的函数，通过显式绑定到person2中，所以this是person2
person1.foo3().call(person2); // person2

/** foo4()返回的是一个箭头函数，没有自己的执行上下文，所以箭头函数的执行找上层
作用域，是person1*/
person1.foo4()(); // person1

/* person1.foo4函数中的this原本指向的是person1 现在显式绑定之后person1.foo4
 函数内的this绑定为person2  又因为person1.foo4.call(person2)返回的是
箭头函数，箭头函数没有执行上下文，所以不是在全局下调用，而是找函数执行的上层
作用域，即person1.foo4函数，此时person1.foo4的this为person2，所以箭头函数
 输出的this为person2 */
person1.foo4.call(person2)(); //  person2

// foo4返回的是箭头函数，箭头函数不能显式绑定，所以只看上层作用域，this指向person1
person1.foo4().call(person2); // person1
```

例 3:

```javascript
var name = 'window';
function Person(name) {
  this.name = name;
  (this.foo1 = function () {
    console.log(this.name);
  }),
    (this.foo2 = () => console.log(this.name)),
    (this.foo3 = function () {
      return function () {
        console.log(this.name);
      };
    }),
    (this.foo4 = function () {
      return () => {
        console.log(this.name);
      };
    });
}
var person1 = new Person('person1');
var person2 = new Person('person2');

person1.foo1();
person1.foo1.call(person2);

person1.foo2();
person1.foo2.call(person2);

person1.foo3()();
person1.foo3.call(person2)();
person1.foo3().call(person2);

person1.foo4()();
person1.foo4.call(person2)();
person1.foo4().call(person2);
```

解析:

```javascript
// 隐式绑定
person1.foo1(); // person1

// 显式绑定优先级大于隐式绑定
person1.foo1.call(person2); // person2

// foo是一个箭头函数，会找上层作用域中的this，那么就是person1
person1.foo2(); // person1

// foo是一个箭头函数，使用call调用不会影响this的绑定，根据作用域向上层查找
person1.foo2.call(person2); // person1

// person1.foo3()返回的是普通函数，此处是在全局直接执行，所以this是默认绑定window
person1.foo3()(); // window

// person1.foo3()返回的是普通函数，此处是在全局直接执行，所以this是默认绑定window
person1.foo3.call(person2)(); // window

// 拿到foo3返回的普通函数后，通过call绑定到person2中进行调用
person1.foo3().call(person2); // person2

// foo4返回了箭头函数，和自身绑定没有关系，上层找到person1
person1.foo4()(); // person1

/* person1.foo4.call(person2) 导致person1.foo4方法内的this为person2
 foo4调用时绑定了person2，返回的函数是箭头函数，调用时，找到了上层绑定的this为person2
  */
person1.foo4.call(person2)(); // person2

// foo4调用返回的箭头函数，和call调用没有关系，找到了上层的this为person1
person1.foo4().call(person2); // person1
```

例 4:

```javascript
var name = 'window';
function Person(name) {
  this.name = name;
  this.obj = {
    name: 'obj',
    foo1: function () {
      return function () {
        console.log(this.name);
      };
    },
    foo2: function () {
      return () => {
        console.log(this.name);
      };
    },
  };
}
var person1 = new Person('person1');
var person2 = new Person('person2');

person1.obj.foo1()();
person1.obj.foo1.call(person2)();
person1.obj.foo1().call(person2);

person1.obj.foo2()();
person1.obj.foo2.call(person2)();
person1.obj.foo2().call(person2);
```

解析:

```javascript
// obj.foo1()返回一个函数 这个函数在全局作用域下直接执行（默认绑定window）
person1.obj.foo1()(); // window

/* 
  最终拿到一个返回的普通函数（虽然多了一步call的绑定）这个普通函数是在全局作用域下直接执行的 
  所以是默认绑定 window 
*/
person1.obj.foo1.call(person2)(); // window

// 拿到返回的普通函数，在全局作用域下调用，但是有用call显绑定this为person2 所以this为person2
person1.obj.foo1().call(person2); // person2

// 拿到foo2()的返回值，是一个箭头函数 箭头函数在执行时找上层作用域下的this，就是obj
person1.obj.foo2()(); // obj

/* foo2()的返回值依然是箭头函数，但是在执行foo2函数时显式绑定了this为person2，所以箭头函数在执行时
找到执行时的上层作用域下的this，找到的person2 */
person1.obj.foo2.call(person2)(); // person2

// foo2()的返回值，依然是箭头函数
// 箭头函数通过call调用是不会显式绑定this，所以找上层作用域下的this式式obj
person1.obj.foo2().call(person2); // obj
```
