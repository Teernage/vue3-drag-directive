# 编译流水线---代码执行过程

## 机器代码：二进制机器码究竟是如何被 CPU 执行的？

<img src="/img/v8/二进制机器码执行流程.webp" alt="二进制机器码执行流程"  />

<img src="/img/v8/js编译流程图.webp" alt="js编译流程图"  />

<img src="/img/v8/计算机系统的硬件组织结构.webp" alt="计算机系统的硬件组织结构"  />

将汇编语言转换为机器语言的过程称为“汇编”；反之，机器语言转化为汇编语言的过程称为“反汇编”

在程序执行之前，需要将程序装进内存中（内存中的每个存储空间都有独一无二的地址）
<img src="/img/v8/内存地址.webp" alt="内存地址" width=350 />

二进制代码被装载进内存后，<span style='color:red'>CPU</span>便可以从内存中取出一条指令，然后分析该指令，最后执行该指令。

把取出指令、分析指令、执行指令这三个过程称为一个<span style='color:red'>CPU</span>时钟周期

<span style='color:red'>CPU</span>中有一个<span style='color:red'>PC</span>寄存器，它保存了将要执行的指令地址，到下一个时钟周期时,<span style='color:red'>CPU</span>便会根据<span style='color:red'>PC</span>寄存器中的地址，从内存中取出指令。

<img src="/img/v8/pc寄存器读取.webp" alt="pc寄存器读取" />

<span style='color:red'>PC</span>寄存器中的指令取出来之后，系统要做<span style='font-weight:bold'>两件事</span>：

<div style='font-weight:bold'>1. 将下一条指令的地址更新到<span style='color:red'>PC</span>寄存器中</div>

比如上图中，CPU 将第一个指令 55 取出来之后，系统会立即将下一个指令的地址填写到 PC 寄存器中，上个寄存器的地址是 100000f90，那么下一条指令的地址就是 100000f91 了，如下图所示：
<img src="/img/v8/pc寄存器读取2.webp" alt="pc寄存器读取2.webp" />

<div style='font-weight:bold'>2. 分析该指令，识别出不同类型的指令，以及各种获取操作数的方法</div>

因为<span style='color:red'>CPU</span>访问内存的速度很慢，所以需要通用寄存器，用来存放<span style='color:red'>CPU</span>中数据的（通用寄存器容量小，读写速度快，内存容量大，读写速度慢。）

- <span style='color:red'>通用</span>寄存器通常用来存放数据或者内存中某块数据的地址，我们把这个地址又称为指针(指针是指向内存中某个位置的变量，可以用来访问和操作存储在该位置的数据)
- <span style='color:red'>ebp</span>寄存器通常是用来存放栈帧指针
- <span style='color:red'>esp</span>寄存器用来存放栈顶指针
- <span style='color:red'>PC</span>寄存器用来存放下一条要执行的指令

常用的指令类型：

1. <span style='font-weight:bold'>加载指令</span>：从内存中复制指定长度的内容到通用寄存器中，并覆盖寄存器中原来的内容

<img src="/img/v8/更新PC寄存器.webp" alt="更新PC寄存器.webp" />
比如上图使用了 movl 指令，指令后面跟着的第一个参数是要拷贝数据的内存的位置，第二个参数是要拷贝到 ecx 这个寄存器

2. <span style='font-weight:bold'>存储指令</span>：和加载类型的指令相反，作用是将寄存器中的内容复制到内存中的某个位置，并覆盖掉内存中的这个位置上原来的内容
   <img src="/img/v8/更新PC寄存器2.webp" alt="更新PC寄存器2.webp" />
   上图也是使用 movl 指令，movl 指令后面的 %ecx 就是寄存器地址，-8(%rbp) 是内存中的地址，这条指令的作用是将寄存器中的值拷贝到内存中。
3. <span style='font-weight:bold'>更新指令</span>：其作用是复制两个寄存器中的内容到 ALU 中，也可以是一块寄存器和一块内存中的内容到 ALU 中，ALU 将两个字相加，并将结果存放在其中的一个寄存器中，并覆盖该寄存器中的内容。具体流程如下图所示：
   <img src="/img/v8/更新指令.webp" alt="更新指令.webp" />
   参看上图，我们可以发现 addl 指令，将寄存器 eax 和 ecx 中的值传给 ALU，ALU 对它们进行相加操纵，并将计算的结果写回 ecx。

4. <span style='font-weight:bold'>跳转指令</span>：从指令本身抽取出一个字，这个字是下一条要执行的指令地址，并将该字复制到 <span style='color:red'>PC</span>寄存器中，并覆盖掉<span style='color:red'>PC</span>寄存器中原来的值
   <img src="/img/v8/跳转指令.webp" alt="跳转指令.webp" />
   观察上图，上图是通过 jmp 来实现的，jmp 后面跟着要跳转的内存中的指令地址。

除了以上指令之外，还有 IO 读 / 写指令，这些指令可以从一个 IO 设备中复制指定长度的数据到寄存器中，也可以将一个寄存器中的数据复制到指定的 IO 设备。

<span style='color:red'>IO 读 / 写指令例子</span>：
假设你有一台电脑,里面有一个 USB 接口,你想把一个 U 盘插到这个 USB 接口上。

从 U 盘<span style='color:red'>读取</span>数据到寄存器:

相当于你把手伸进 U 盘,抓取里面的某个文件或数据,放到你手上(寄存器)。
对应的 CPU 指令是: IN AL, 0x3F8，将 U 盘地址 0x3F8 处的 1 个字节数据读取到寄存器 AL 中。

将寄存器中的数据<span style='color:red'>写入</span>U 盘:

相当于你把手上(寄存器)拿着的某个文件或数据,放回到 U 盘里。
对应的 CPU 指令是: OUT 0x3F8, AL，将寄存器 AL 中的 1 个字节数据写入到 U 盘地址 0x3F8 处。
通过这种 I/O 读写指令,CPU 就可以与外部的 U 盘设备进行数据交互和传输,就像你用手在 U 盘和手上(寄存器)之间转移数据一样。

这样的 I/O 指令不仅适用于 U 盘,也适用于其他外围设备,如键盘、显示器、打印机等,让 CPU 能够与各种外部设备进行通信和控制。

以上就是一些基础的指令类型，这些指令像积木，利用它们可以搭建我们现在复杂的软件大厦。

### 分析一段汇编代码的执行流程

在 C 程序中，CPU 会首先执行调用 main 函数，在调用 main 函数时，CPU 会保存上个栈帧上下文信息和创建当前栈帧的上下文信息，主要是通过下面这两条指令实现的：

```javascript
pushq   %rbp
movq    %rsp, %rbp
```

第一条指令 pushq %rbp，是将 rbp 寄存器中的值写到内存中的栈区域。第二条指令是将 rsp 寄存器中的值写到 rbp 寄存器中。

然后将 0 写到栈帧的第一个位置，对应的汇编代码如下：

```javascript
movl  $0, -4(%rbp)
```

接下来给 x 和 y 赋值，对应的代码是下面两行：

```javascript
movl  $1, -8(%rbp)
movl  $2, -12(%rbp)
```

第一行指令是将常数值 1 压入到栈中，然后再将常数值 2 压入到栈中，这两个值分别对应着 x 和 y。

接下来，x 的值从栈中复制到 eax 寄存器中，对应的指令如下所示：

```javascript
movl  -8(%rbp), %eax
```

现在 eax 寄存器中保存了 x 的值，那么接下来，再将内存中的 y 和 eax 中的 x 相加，相加的结果再保存在 eax 中，对应的指令如下所示：

```javascript
 movl  %eax, -16(%rbp)
```

最后又将结果 z 加载到 eax 寄存器中，代码如下所示：

```javascript
movl  -16(%rbp), %eax
```

注意这里的 eax 寄存器中的内容就被默认作为返回值了，执行到这里函数基本就执行结束了，然后需要继续执行一些恢复现场的操作，代码如下所示：

```javascript
popq % rbp;
retq;
```

到了这里，我们整个程序就执行结束了。

## 堆和栈：函数调用是如何影响到内存布局的？

### 函数有两个主要的特性：

1. 可以被调用
2. 具有作用域机制

所以：

- 函数调用者的生命周期比被调用者的长（后进），被调用者的生命周期先结束 (先出)
- 从函数资源分配和回收角度来看:
  - 被调用函数的资源分配晚于调用函数 (后进)，
  - 被调用函数资源的释放先于调用函数 (先出)

栈的状态从<span style='color:red'> add </span>中恢复到<span style='color:red'> main </span>函数的上次执行时的状态，这个过程称为<span style='font-weight:bold'>恢复现场</span>。

```javascript
function main() {
  add();
}
function add(num1, num2) {
  return num1 + num2;
}
```

怎么恢复 main 函数的执行现场呢：

1. 在<span style='color:red'>esp</span>寄存器中保存一个永远指向当前栈顶的指针
   告诉你往哪个位置添加新元素
2. <span style='color:red'>ebp</span> 寄存器，保存当前函数的起始位置（也叫<span style='font-weight:bold'>栈帧指针</span>）

- 告诉 <span style='color:red'>CPU</span> 移动到这个地址

栈帧：调用栈中每个函数对应的内存区域，每个栈帧对应着一个未运行完的函数，栈帧中保存了该函数的参数、返回地址和局部变量。
