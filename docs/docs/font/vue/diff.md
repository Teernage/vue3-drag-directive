# diff 算法

#### vue3 在 template 模版下支持多个根元素，是如何做到的？

vue3 是使用 Fragment 节点将 template 模板下的多个根节点包裹起来，所以这样的话 template 模板下面就只有一个根元素，那就 Fragment，然后再 vue 内部渲染的时候只会渲染 Fragment 的 children 内容，因为 Fragment 本身不会渲染任何真实 dom 内容，只是起了一个包裹的作用，只有其包裹内容即 children 才是真正要渲染的

## 虚拟 DOM diff 算法概述

diff 算法主要是在 patchChildren 函数中实现的，用于比对和更新新旧虚拟节点的子节点集合（即节点 children 内容），而对节点自身的比对主要是进行属性(props)的简单更新，这种属性更新不需要复杂的 diff 算法，只需要遍历对比新旧属性值即可。

```javaScript
// 伪代码示例
function patch(n1, n2) {
    // n1: 旧节点, n2: 新节点

    // 比对节点类型
    if (n1.type !== n2.type) {
        // 节点类型不同，直接替换
        replaceElement(n1, n2);
        return;
    }

    // 比对节点属性
    patchProps(n1.el, n1.props, n2.props);

    // 然后才进入子节点比对
    patchChildren(n1, n2);
}
```

#### 新旧节点的子节点更新有几种情况？

九种情况

<img src="/img/vue/新旧节点比对的各种情况.webp" width=400 alt="新旧节点比对的各种情况"  />

若新节点没有子节点：

1. 若旧节点也没有子节点：不更新。
2. 若旧节点是文本子节点：清空旧节点的文本。
3. 若旧节点是一组子节点：移除旧节点对应的 DOM 内容。

若新节点是文本子节点：

4. 若旧节点没有子节点：将新节点的文本内容插入 DOM。
5. 若旧节点是文本子节点：更新为新节点的文本内容。
6. 若旧节点是一组子节点：移除旧节点对应的 DOM 内容，并将新节点的文本内容插入 DOM。

若新节点是一组子节点：

7. 若旧节点没有子节点：创建新节点的子节点内容，并插入 DOM。
8. 若旧节点是文本子节点：清空旧节点的文本内容，创建新节点的子节点内容，并插入 DOM。
9. <span style='color:red'>若旧节点也是一组子节点：此时需要引入 diff 算法，进行逐一对比并更新 DOM。</span>

所以 diff 算法是来处理新旧虚拟节点的 children 都是数组(混合节点结合)的情况

#### diff 算法匹配的是什么情况？

diff 算法只关心新旧虚拟节点都存在一组子节点的情况，也就是新 vnode 和旧 vnode 的 children 都是数组

#### diff 算法中是如何判断判断虚拟节点是否可复用的？

在 diff 算法中，通过判断新旧虚拟节点的 type 和 key 是否一致，来确定虚拟节点是否可复用。

如果一致，则说明是相同类型且相同 key 的 vnode，但这并不意味着不需要更新。

由于响应式变量更新后，前后生成的 vnode 是两个不同的对象，内存地址不同。新的 vnode 表示更新后的状态，旧的 vnode 表示更新前的状态。

可复用的含义是旧虚拟节点对应的 DOM 元素可以继续使用，而不需要销毁重建。但新旧 vnode 的内容可能不同，因此需要通过 patch 对比两者的差异，决定是否需要更新 DOM。如果有差异，就对 DOM 进行更新。

#### 为什么只有要生成元素的虚拟节点对象用到 diff 算法(对比新旧 vnode 都有 children 数组的情况，即新旧虚拟节点都有子结点)，而其他节点类型不用？

元素类型虚拟节点的 children 可能是 null，可能是 string 即文本，可能是数组，数组的话就是各个子结点，如果新旧虚拟节点的 children 都是数组，那么就涉及排序等问题，这时候 diff 算法就需要介入了，但是如果是文本或者注释节点，他们的虚拟节点的 children 就是 string 字符串，新旧节点不同的话，直接操作 dom 将内容替换为新的虚拟节点对应的 children 内容即可

对于同类型的文本节点或注释节点的更新，的确不需要像元素节点那样复杂的 DOM diff 算法。这是因为文本节点和注释节点的 children 就是 string 文本，所以直接修改了，children 文本也不会涉及到节点顺序变化的问题。

当更新同类型的文本节点时，只需简单地替换 children 文本内容即可，不需要考虑节点的移动或重新排序。同样，注释节点的更新也是类似的，只需更新注释的 children 内容，而不需要考虑节点的移动或重新排序。

因此，针对同类型的文本节点或注释节点的更新，Vue 可以更加高效地进行处理，不需要进行复杂的 DOM diff 算法。这种简化的处理方式可以提高更新的效率，因为它们不会涉及到 DOM 结构的重新排列或移动。

## 简单 diff 算法

遍历新的虚拟节点集合，从头开始获取新虚拟节点在旧虚拟节点集合中的索引，如果获取到在旧 children 中的对应索引是递增的，那么说明不需要移动，反之，则需要移动。

#### vnode 有 key 和无 key 的区别：

如果没有 key 我们无法知道新子节点与旧子节点 间的映射关系，也就无法知道应该如何移动节点。有 key 的话情况则 不同，我们根据子节点的 key 属性，能够明确知道新子节点在旧子节 点中的位置，这样就可以进行相应的 DOM 移动操作了。

<img src="/img/vue/简单diff算法1.webp" width=700 alt="简单diff算法1"  />

如果没有设置 key，那么就会删除旧节点对应的 dom，根据新虚拟节点暴力创建新的 dom 进行挂载

<span style='color:red'>强调：DOM 可复用并不意味着不需要更新</span>.如下所示的 2 个虚拟节点：

```javascript
const oldVNode = { type: 'p', key: 1, children: 'text 1' };
const newVNode = { type: 'p', key: 1, children: 'text 2' };
```

这两个虚拟节点拥有相同的 key 值和 vnode.type 属性值。这意味着,在更新时可以复用 DOM 元素，即只需要通过移动操作来完成更新。但仍需要对这两个虚拟节点进行打补丁操作，因为新的虚拟节点 (newVNode)的文本子节点的内容已经改变了(由’text 1’变成 ‘text 2’)。因此，在讨论如何移动 DOM 之前，我们需要先完成打补丁操作.

```javascript
const oldVNode = {
  type: 'div',
  children: [
    { key: 1, type: 'p', children: '1' },
    { key: 2, type: 'p', children: '2' },
    { key: 3, type: 'p', children: '3' },
  ],
};

const newVNode = {
  type: 'div',
  children: [
    { key: 3, type: 'p', children: '3' },
    { key: 1, type: 'p', children: '1' },
    { key: 2, type: 'p', children: '2' },
  ],
};
```

找到需要移动的元素

```javascript
// 1.找到需要移动的元素
function patchChildren(n1, n2) {
  const oldChildren = n1.children;
  const newChildren = n2.children;

  let lastIndex = 0;
  for (let i = 0; i < newChildren.length; i++) {
    const newVNode = newChildren[i];
    for (j = 0; j < oldChildren.length; j++) {
      const oldVNode = oldChildren[j];
      if (newVNode.key === oldVNode.key) {
        // 移动DOM之前，我们需要先完成对虚拟节点的打补丁操作 然后再更新虚拟节点对应的dom
        patch(oldVNode, newVNode, container);

        if (j < lastIndex) {
          console.log('需要移动的节点', newVNode, oldVNode, j);
        } else {
          lastIndex = j;
        }
        break;
      }
    }
  }
}
patchChildren(oldVNode, newVNode);
```

#### 如何移动元素

更新的过程：

- 第一步:取新的一组子节点中第一个节点 p-3，它的 key 为 3，尝试在旧的一组子节点中找到具有相同 key 值的可复用节点。发现能够找到，并且该节点在旧的一组子节点中的索引为 2。此时变量 lastIndex 的值为 0，索引 2 不小于 0，需要更新变量 lastIndex 的值为 2。因为此时新 p-3 对应的旧 p-3 的索引 2 就是最大索引，所以节点 p-3 对应的真实 DOM 不需要移动

- 第二步:取新的一组子节点中第二个节点 p-1，它的 key 为 1，尝试在旧的一组子节点中找到具有相同 key 值的可复用节点。发现能够找到，并且该节点在旧的一组子节点中的索引为 0。此时变量 lastIndex 的值为 2，索引 0 小于 2，所以节点 p-1 对应的真实 DOM 需要移动。

到了这一步，我们发现，节点 p-1 对应的真实 DOM 需要移动，但应该移动到哪里呢?我们知道， children 的顺序其实就是更新后真实 DOM 节点应有的顺序。所以 p-1 在新 children 中的位置就代表了真实 DOM 更新后的位置。由于节点 p-1 在新 children 中排在节点 p-3 后面，所以我们应该把节点 p-1 所对应的真实 DOM 移到节点 p-3 所对应的真实 DOM 后面。

可以看到，这样操作之后，此时真实 DOM 的顺序为 p-2、p-3、p-1。

<img src="/img/vue/简单diff算法2.webp" width=600 alt="简单diff算法2"  />

- 第三步:取新的一组子节点中第三个节点 p-2，它的 key 为 2。尝试在旧的一组子节点中找到具有相同 key 值的可复用节点。发现能够找到，并且该节点在旧的一组子节点中的索引为 1。此时变量 lastIndex 的值为 2，索引 1 小于 2，所以节点 p-2 对应的真实 DOM 需要移动。

第三步与第二步类似，节点 p-2 对应的真实 DOM 也需要移动。 面后同样，由于节点 p-2 在新 children 中排在节点 p-1 后面，所以我们应该把节点 p-2 对应的真实 DOM 移动到节点 p-1 对应的真实 DOM 后面。移动后的结果如图下图所示：

<img src="/img/vue/简单diff算法3.webp" width=600 alt="简单diff算法3"  />

经过这一步移动操作之后，我们发现，真实 DOM 的顺序与新的一组子节点的顺序相同了:p-3、p-1、p-2。至此，更新操作完成。

```javascript
function patchChildren(n1, n2) {
  const oldChildren = n1.children;
  const newChildren = n2.children;

  let lastIndex = 0;

  for (let i = 0; i < newChildren.length; i++) {
    // 在第一层循环中定义变量 find，代表是否在旧的一组子节点中找到可复用的节点
    let find = false;

    const newVNode = newChildren[i];

    for (j = 0; j < oldChildren.length; j++) {
      const oldVNode = oldChildren[j];
      if (newVNode.key === oldVNode.key) {
        // 一旦找到可复用的节点，则将变量 find 的值设为 true
        find = true;

        if (j < lastIndex) {
          // console.log('需要移动的节点', newVNode, oldVNode, j)

          const prevVNode = newChildren[i - 1];
          if (prevVNode) {
            // 2.找到 prevVNode 所对应真实 DOM 的下一个兄 弟节点，并将其作为锚点
            const anchor = prevVNode?.el?.nextSibling;

            console.log('插入', prevVNode, anchor);
          }
        } else {
          lastIndex = j;
        }
        break;
      }
    }

    // 如果代码运行到这里，find 仍然为 false,说明当前newVNode没有在旧的一组子节点中找到可复用的节点，也就是说，当前newVNode是新增节点，需要挂载
    if (!find) {
      const prevVNode = newChildren[i - 1];
    }
  }

  // 移除不存在的元素
  for (let i = 0; i < oldChildren.length; i++) {
    const oldVNode = oldChildren[i];
    const has = newChildren.find((vnode) => vnode.key === oldVNode.key);

    // 如果没有找到具有相同 key 值的节点，则说明需要删除该节点
    if (!has) {
      // 调用 unmount 函数将其卸载
      unmount(oldVNode);
    }
  }
}
patchChildren(oldVNode, newVNode);
```

算法的核心是使用 lastIndex 优化策略，通过记录遍历过的节点的最大索引值，来判断节点是否需要移动。如果当前新虚拟节点对应的旧虚拟节点的索引值是最大的即 lastIndex，那么不需要移动，否则需要移动。

执行顺序：

先处理节点 key=3：找到对应旧节点，索引确实是最后的，位置正确，不需要移动
再处理节点 key=1：找到对应旧节点，但位置在 lastIndex 之前，需要移动到节点 3 后面
最后处理节点 key=2：找到对应旧节点，位置也在 lastIndex 之前，需要移动到节点 1 后面
移动规则：

当发现节点需要移动时，通过找到前一个节点(prevVNode)的下一个兄弟节点作为锚点(prevVNode.el 就是旧虚拟节点对应的 dom，内部环节将旧节点对应的 dom 保存在新虚拟节点的 el 属性中了，所以新虚拟节点的 el 属性保存了旧节点对应的 dom)
将当前节点移动到这个锚点之前(用 insertBefore)

最终进行删除检查：

遍历旧节点列表
检查每个旧节点是否在新节点列表中存在
如果不存在则删除该节点

这种简单 diff 算法的特点是：
它能够处理节点的移动、添加和删除
性能不如双端 diff 算法，因为使用了双层循环
移动节点的策略相对简单，可能会产生一些不必要的移动

#### 总结：

第一层循环遍历新虚拟节点集合，第二层循环遍历旧虚拟节点集合，如果在旧集合中找不到相同 key 的，那么意味着需要新增，key 相同的则进行 path 更新内容，最后移动

最后再单独遍历旧集合，找到不存在于新集合的节点，然后将不存在于新虚拟节点集合的节点对应的 dom 从父集中删除

如何移动的，锚点怎么定？

锚点就是当前遍历到的新节点的前一个节点对应的 dom 的下一个兄弟节点

```javascript
const prevVNode = newChildren[i - 1];
prevVNode.el.next.nextSibling;
```

用 insertBefore 来进行插入操作，所以我们插入的位置是：<span style='color:red'>当前节点的前一个节点对应的 dom 的下一个兄弟节点之前</span>

```javascript
初始DOM：[p-1, p-2, p-3]
目标DOM：[p-3, p-1, p-2]

处理p-1时：
- 需要移动到p-3后面
- 所以要找到p-3.nextSibling作为锚点
- 执行insertBefore(p-1的DOM, p-3.nextSibling)

处理p-2时：
- 需要移动到p-1后面
- 所以要找到p-1.nextSibling作为锚点
- 执行insertBefore(p-2的DOM, p-1.nextSibling)
```

## 双端 diff 算法

双端 Diff 算法是一种同时对新旧两组子节点的两个端点进行比较的算法。因此，我们需要四个索引值，分别指向新旧两组子节点的端点

<img src="/img/vue/双端diff算法.webp" width=700 alt="双端diff算法"  />

双端比较的方式：

第一步：头头对比

- 旧虚拟节点集合的第一个节点和新虚拟节点集合的第一个节点
- 如果是相同 key 节点则 path 更新内容，不用移动，因为都是第一个位置 ，新旧虚拟节点集合的开始指针递增
- key 不等：进行第二步

第二步 尾尾对比

- 旧虚拟节点集合的最后一个节点和新虚拟节点集合的最后一个节点
- 如果是相同 key 节点，则 path 更新内容，不用移动，因为都是最后一个位置，新旧虚拟节点集合的结束指针递减
- key 不等则进行第三步

第三步 头尾对比

- 旧虚拟节点集合的第一个节点和新虚拟节点集合的最后一个节点
- 如果是相同 key 节点，则 path 更新内容，然后再移动位置，位置是以新虚拟节点位置为准，因为新虚拟节点是最后一个位置，所以取的锚点位置是旧节点集合最后一个位置的下一个兄弟节点，插入到这个锚点之前(用 inserBefore)。旧虚拟节点集合的开始指针递增，新虚拟节点集合的结束指针递减

key 不等则进行第四步

第四步 尾头对比

- 旧虚拟节点集合的最后一个节点和新虚拟节点集合的第一个节点
- 如果是相同 key 节点，则 path 更新内容，然后再移动位置，位置是以新虚拟节点位置为准，因为新虚拟节点是第一个位置，所以取的锚点位置是旧节点集合第一个位置，插入到这个锚点之前(用 insertBefore)。新虚拟节点集合的开始指针递增，旧虚拟节点集合的结束指针递减

key 不等则进行第五步

第五步：遍历旧节点集合，找找存不存在新虚拟节点集合的第一个节点，如果不存在，那么说明第一个新虚拟节点是新增的，所以需要新增 dom，并插入到当前旧节点集合的第一个虚拟节点对应的 dom(oldStartVNode.el)的前面,然后新虚拟节点集合的头指针递增，如果存在，则将当前相同 key 的 vnode 对应的 dom 移动到最前面，新虚拟节点集合的头指针递增，然后将相同 key 的旧 vnode 置为 underfined，这样做是为了标记当前这个旧虚拟节点已经处理过了，之后遍历到这个 underfined 跳过即可，然后进入下一次循环，还是头头 、尾尾、头尾、尾头对比...

<img src="/img/vue/双端diff算法2.webp" width=700 alt="双端diff算法2"  />

```javascript
while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
  // 增加两个判断分支，如果头尾部节点为 undefined，则说明该节点已经被处理过了，直接跳到下一个位置
  if (!oldStartVNode) {
    oldStartVNode = oldChildren[++oldStartIdx];
  } else if (!oldEndVNode) {
    oldEndVNode = oldChildren[--oldEndIdx];
  } else if (oldStartVNode.key === newStartVNode.key) {
    // 步骤一:oldStartVNode 和 newStartVNode 比较
    // 调用 patch 函数在 oldStartVNode 与 newStartVNode 之间打补丁
    patch(oldStartVNode, newStartVNode, container);
    // 更新相关索引，指向下一个位置
    oldStartVNode = oldChildren[++oldStartIdx];
    newStartVNode = newChildren[++newStartIdx];
  } else if (oldEndVNode.key === newEndVNode.key) {
    // 步骤二:oldEndVNode 和 newEndVNode 比较
    // 节点在新的顺序中仍然处于尾部，不需要移动，但仍需打补丁
    patch(oldEndVNode, newEndVNode, container);

    // 更新索引和头尾部节点变量
    oldEndVNode = oldChildren[--oldEndIdx];
    newEndVNode = newChildren[--newEndIdx];
  } else if (oldStartVNode.key === newEndVNode.key) {
    // 步骤三:oldStartVNode 和 newEndVNode 比较
    patch(oldStartVNode, newEndVNode, container);
    insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling);

    oldStartVNode = oldChildren[++oldStartIdx];
    newEndVNode = newChildren[--newEndIdx];
  } else if (oldEndVNode.key === newStartVNode.key) {
    // 我们找到了具有相同 key 值的节点。这说明，原来处于尾部的节点在新的顺序中应该处于头部。
    // 于是，我们只需要以头部元素oldStartVNode.el 作为锚点，将尾部元素 oldEndVNode.el 移动到锚点前面即可。
    // 但需要注意的是，在进行 DOM 的移动操作之前，仍然需要调用 patch 函数在新旧虚拟节点之间打补丁。

    // 第四步:oldEndVNode 和 newStartVNode 比较
    // 仍然需要调用 patch 函数进行打补丁
    patch(oldEndVNode, newStartVNode, container);

    // 移动dom操作  oldEndVNode.el 移动到 oldStartVNode.el 前面
    insert(oldEndVNode.el, container, oldStartVNode.el);

    // 移动 DOM 完成后，更新索引值，指向下一个位置
    oldEndVNode = oldChildren[--oldEndIdx];
    newStartVNode = newChildren[++newStartIdx];
  } else {
    // 处理非理想情况

    // 在旧的一 组子节点中，找到与新的一组子节点的头部节点具有相同 key 值的节点
    // 遍历旧的一组子节点，试图寻找与 newStartVNode 拥有相同 key 值的节点
    // idxInOld 就是新的一组子节点的头部节点在旧的一组子节点中的索引
    const idxInOld = oldChildren.findIndex(
      (node) => node.key === newStartVNode.key
    );

    // idxInOld 大于 0，说明找到了可复用的节点，并且需要将其对应的真实DOM 移动到头部
    if (idxInOld > 0) {
      // idxInOld 位置对应的 vnode 就是需要移动的节点
      const vnodeToMove = oldChildren[idxInOld];

      // 不要忘记除移动操作外还应该打补丁
      patch(vnodeToMove, newStartVNode, container);

      // 将 vnodeToMove.el 移动到头部节点 oldStartVNode.el 之前，因此使用后者作为锚点
      insert(vnodeToMove.el, container, oldStartVNode.el);

      // 由于位置 idxInOld 处的节点所对应的真实 DOM 已经移动到了别处，因此将其设置为 undefined
      oldChildren[idxInOld] = undefined;

      // 最后更新 newStartIdx 到下一个位置
      newStartVNode = newChildren[++newStartIdx];
    }
  }
}
```

小结：
双端 diff 相比于简单 diff 算法的优势就是减少了移动次数
双端对比算法依次进行头头、尾尾、头尾、尾头四种匹配，相同节点只更新属性和子节点、不移动位置，不同节点则根据新节点的位置进行调整：在头部用旧头节点作为锚点插入，在尾部用旧尾的下一个兄弟节点作为锚点插入。若旧节点集合中找不到匹配的新节点，则将其视为新增节点，通过 insertBefore 插入到正确位置后，更新新旧节点集合的指针，继续下一轮对比，最终完成所有节点的更新、删除和新增操作。

## 快速 diff 算法

<img src="/img/vue/快速diff算法大致流程图.webp" width=600 alt="快速diff算法大致流程图"  />

快速 Diff 算法，顾名思义，该算法的实测速度非常快

1. 首先进行自左向右的 diff 对比 定义一个开始指针 i，和两个结束指针(因为新旧虚拟节点集合长度可能不一样)，

开始指针从左向右移动，分别比较新旧虚拟节点集合的第一、第二个虚拟节点的 key 是否相同，如果相同则进行 path 看看内容是否有更新，然后开始指针向右移动，直到遇到 key 不相同的 vnode 节点则停下来跳出 while 循环，进入第二步，即从右往左遍历

2. 然后自右向左的 diff 对比，两个结束指针分别指向新旧虚拟节点集合的最后一个虚拟节点，首先比较新旧虚拟节点集合的最后一个节点的 key 是否相同， 如果相同则 path，然后两个结束指针递减，继续判断两个结束指针指向的 vnode 的 key 是否相等，如果相等则 path，不相等则退出 while 循环

前两步都是在遍历寻找相同 key 的 vnode 进行 path，找到 key 不相同的 vnode 位置则停下来

此时开始指针 i 和两个结束指针(newEndIndex 和 oldEndIndex)都有值

3. 新节点集合多于旧节点集合 时的 diff 比对 (除了多的出来的，剩下的节点是相同 key 的; i > oldEndIndex && i < newEndIndex,开始指针大于旧节点结束指针，说明此时已经退出循环了，旧节点集合的虚拟节点都已经处理过了。开始指针小于新节点结束指针，说明是正常的，因为开始小于结束，此时说明新虚拟节点集合还有虚拟节点没处理，这些还没有处理的新虚拟节点都是需要新增的节点)

4. 旧节点集合多于新节点集合时的 diff 比对 (除了多的出来的，剩下的节点是相同 key 的； i < oldEndIndex && i >newEndIndex,开始指针大于新节点结束指针，不正常，说明已经退出循环，意味着新虚拟节点结合的节点都已经处理过了，开始指针小于旧结束指针，正常，说明此时旧节点集合还有节点没有处理，更新以新节点为主，新节点已经处理完了，所以剩下没处理的旧节点对应的 dom 需要被删除)

5. 利用最长递增子序列来辅助处理中间部分

- 5.1 初始化一个映射表 newIndexToOldIndexMap，用来存储新虚拟节点中间部分的节点的索引
- 5.2 遍历老节点集合中间部分节点，
  找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
  找到新老节点都有的，—> 需要 patch 看看内容需不需要更新，此时遍历到的索引添加到

newIndexToOldIndexMap 数组中，这个数组的个数代表着新节点集合中间部分节点的个数，每个初始值为-1，赋的值代表着中间部分节点在老节点集合中的索引

- 5.3 根据最长递增子序列来找 newIndexToOldIndexMap 数组中的稳定组合，即不需要移动的组合

然后对不稳定的节点进行排序，倒叙遍历新虚拟节点集合的中间部分节点，过滤掉稳定节点，对不稳定节点进行移动操作。

#### 为什么到倒叙？

因为要找稳定的锚点，倒叙的话，最后一个节点是确定的，所以是稳定的
锚点怎么定？也就是遍历新节点集合中间部分时的当前节点的下一个节点对应的 dom 元素。(又因为是倒遍历，所以锚点是位置确定的节点)

### 快速 diff 算法的归纳总结

#### 在 Vue 3 的快速 diff 算法中，进行双端分别对比之后，剩下的情况可以归纳为三种：

1. 新 vnode 集合 > 旧的 vnode 集合，其中新虚拟节点集合节点数大于旧虚拟节点集合节点数，除了新 vnode 集合多出来的部分，剩下新虚拟节点都已经处理过了(这部分是和旧虚拟节点集合中相同 key 和 type 的 vnode，此时旧 vnode 集合已经全部处理完毕)，所以也就是除了新增的，剩下的都是相同 key 和 type 的 vnode，只是作了 path 进行看看是否需要更新节点的内容，剩下新虚拟节点集合中未处理的节点都是需要新增的，因此需要进行新增操作。
2. 新 vnode 集合 < 旧的 vnode 集合，其中新虚拟节点集合节点数小于旧虚拟节点集合节点数，除了旧虚拟节点集合多出来的部分，剩下的旧虚拟节点都已经处理过了(处理过旧虚拟节点集合的这部分是和新虚拟节点集合中是相同 key 和 type 的 vnode，此时新 vnode 集合已经全部处理完毕)，所以剩下旧虚拟节点集合中未处理的节点都是需要删除的，因为要以新虚拟节点集合为主，因此需要进行删除操作
3. 新旧虚拟节点除了两端一致，中间部分不一致。在这种情况下，需要采用最长递增子序列来确定稳定不变的组合，然后对不稳定的元素进行移动操作。

这些情况涵盖了在 Vue 3 的 diff 算法中可能出现的变化情况。

#### 以下是快速 diff 算法的核心源码：

```javaScript
  function patchKeyedChildren(
    c1: any[],
    c2: any[],
    container,
    parentAnchor,
    parentComponent
  ) {
    // 开始指针
    let i = 0;
    // 新虚拟节点集合的长度
    const l2 = c2.length;
    // 旧虚拟节点集合的尾指针
    let e1 = c1.length - 1;
    // 新虚拟节点集合的尾指针
    let e2 = l2 - 1;

    // 判断当前的vnode的key和type是否一致，如果一致说明是相同类型的vnode，只是先后创建顺序不一样，后面的是更新后生成的
    const isSameVNodeType = (n1, n2) => {
      return n1.type === n2.type && n1.key === n2.key;
    };

    // 1. 从左往右进行匹配，直到遇到不同key的vnode即停下来 ---> 跳出循环
    while (i <= e1 && i <= e2) {
      const prevChild = c1[i];
      const nextChild = c2[i];

      if (!isSameVNodeType(prevChild, nextChild)) {
        console.log("两个 child 不相等(从左往右比对)");
        console.log(`prevChild:${prevChild}`);
        console.log(`nextChild:${nextChild}`);
        break;
      }

      console.log("两个 child 相等，接下来对比这两个 child 节点(从左往右比对)");
      patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      i++;
    }

    //2. 从右往左匹配，直到遇到不同key的vnode即停下来 ---> 跳出循环
    while (i <= e1 && i <= e2) {
      // 从右向左取值
      const prevChild = c1[e1];
      const nextChild = c2[e2];

      if (!isSameVNodeType(prevChild, nextChild)) {
        console.log("两个 child 不相等(从右往左比对)");
        console.log(`prevChild:${prevChild}`);
        console.log(`nextChild:${nextChild}`);
        break;
      }
      console.log("两个 child 相等，接下来对比这两个 child 节点(从右往左比对)");
      patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      e1--;
      e2--;
    }

    // 3.新的虚拟节点集合中虚拟节点节点个数多于旧的虚拟节点集合的
    // 新增节点的情况：
    // i > e1 头指针 > 旧尾指针(非正常)，说明旧虚拟节点集合的所有虚拟节点都已经处理过了
    // i <= e2 头指针 < 新尾指针 (正常情况)，说明新虚拟节点集合还有节点没有处理完，那么没处理的就是要新增的dom
    if (i > e1 && i <= e2) {
      // 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题
      // 要添加的位置是当前的尾指针e2的索引位置的下一个节点之前
      // 所以我们需要从 e2 + 1 取到锚点的位置
      const nextPos = e2 + 1; // 添加到当前新虚拟节点的尾指针的位置的下一个位置之前
      // 获取到当前虚拟节点的下一个虚拟节点对应的dom: 作为锚点
      const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
      // 遍历新虚拟节点集合中没有处理的节点 就是索引i开始指针 到 e2尾指针之间的虚拟节点，全部插入到anchor这个dom之前
      while (i <= e2) {
        console.log(`需要新创建一个 vnode: ${c2[i].key}`);
        patch(null, c2[i], container, anchor, parentComponent);
        i++;
      }
    }
    // 4.新的虚拟节点集合中虚拟节点个数小于于旧的虚拟节点集合的
    //   删除节点的情况：
    //    i > e2 头指针 > 新尾指针(非正常)，说明新虚拟节点集合的所有虚拟节点都已经处理过了
    //   i <= e1 头指针 < 旧尾指针 (正常情况)，说明旧虚拟节点集合还有节点没有处理完，那么没处理的就是要删除的dom，
    //   因为是以新虚拟节点集合为准来更新视图上的dom的
    else if (i > e2 && i <= e1) {
      // 这种情况的话说明新节点的数量是小于旧节点的数量的
      // 那么我们就需要遍历旧虚拟节点从开始指针i到结束指针e1之间的虚拟节点对应的dom从父元素中删除
      while (i <= e1) {
        console.log(`需要删除当前的 vnode: ${c1[i].key}`);
        hostRemove(c1[i].el);
        i++;
      }
    }
    // 5. 新旧节点集合中的两端相同，中间部分不同，处理中间部分
    else {
      // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
      // 例如下面的情况
      // a,b,[c,d,e],f,g
      // a,b,[e,c,d],f,g

      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = new Map();
      let moved = false;
      let maxNewIndexSoFar = 0;
      // 先把 key 和 newIndex 绑定好，方便后续基于 key 找到 newIndex
      // 时间复杂度是 O(1)
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 需要处理中间部分的新节点数量 如上例子就是[e,c,d]三个, 所以e2 - s2 + 1 === 3
      const toBePatched = e2 - s2 + 1;
      // 当前中间部分节点已经打补丁个数
      let patched = 0;
      // 初始化 从新的index映射为老的index
      // 创建数组的时候给定数组的长度，这个是性能最快的写法
      const newIndexToOldIndexMap = new Array(toBePatched);
      // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      // 遍历老节点
      // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
      // 2. 新老节点都有的，—> 需要 patch
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 优化点
        // 如果老的节点大于新节点的数量的话，那么这里在处理老节点的时候就直接删除即可
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key != null) {
          // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
          // 时间复杂度O(1)
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
          // 时间复杂度O(n)
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // 因为有可能 nextIndex 的值为0（0也是正常值）
        // 所以需要通过值是不是 undefined 或者 null 来判断
        if (newIndex === undefined) {
          // 当前节点的key 不存在于 newChildren 中，需要把当前节点给删除掉
          hostRemove(prevChild.el);
        } else {
          // 新老节点都存在
          console.log("新老节点都存在");
          // 把新节点的索引和老的节点的索引建立映射关系
          // i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在老的节点中不存在)
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 来确定中间的节点是不是需要移动
          // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
          // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
          // 不是升序的话，我们就可以确定节点移动过了
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          patch(prevChild, c2[newIndex], container, null, parentComponent);
          patched++;
        }
      }

      // 利用最长递增子序列来优化移动逻辑
      // 因为元素是升序的话，那么这些元素就是不需要移动的
      // 而我们就可以通过最长递增子序列来获取到升序的列表
      // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
      // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
      // getSequence 返回的是 newIndexToOldIndexMap 的索引值
      // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      // 遍历新节点
      // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
      // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]

      // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
      // 因为 insert 逻辑是使用的 insertBefore()
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 确定当前要处理的节点索引 倒叙循环遍历
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        // 锚点等于当前节点索引+1
        // 也就是当前节点的后面一个节点(又因为是倒遍历，所以锚点是位置确定的节点)
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;

        if (newIndexToOldIndexMap[i] === 0) {
          // 说明新节点在老的里面不存在
          // 需要创建
          patch(null, nextChild, container, anchor, parentComponent);
        } else if (moved) {
          // 需要移动
          // 1. j 已经没有了 说明剩下的都需要移动了
          // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            // 移动的话使用 insert 即可
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 这里就是命中了  index 和 最长递增子序列的值
            // 所以可以移动指针了
            j--;
          }
        }
      }
    }
  }
```

## 总结

#### 三种算法的锚点:

锚点是用于插入或移动 DOM 节点的参考位置。

1. 简单 diff 算法锚点的定义

   移动节点时的锚点是当前要移动的新虚拟节点在旧虚拟节点集合中对应位置的下一个兄弟节点。通过这个锚点，使用 insertBefore 方法将节点移动到正确的位置。

2. 双端对比锚点的定义：

- 插入到最前面：锚点是旧虚拟节点集合的头节点对应的 DOM 元素（oldStartVNode.el）。使用 insertBefore(newNode, oldStartVNode.el) 将新节点插入到旧头节点之前。
- 插入到最后面：锚点是旧虚拟节点集合尾节点的下一个兄弟节点（oldEndVNode.el.nextSibling）。使用 insertBefore(newNode, oldEndVNode.el.nextSibling) 将新节点插入到旧尾节点之后。

移动是移动旧虚拟节点集合对应的 dom 集合的顺序。

3. 快速 diff 算法的增删改三种情况，其中只有新增和移动有锚点：

- 新 vnode 集合 > 旧的 vnode 集合，新增操作。此时新增锚点就是：新虚拟节点集合的结束指针+1
- 新 vnode 集合 < 旧的 vnode 集合，删除操作。删除不需要锚点
- 新旧虚拟节点除了两端一致，中间部分不一致。在这种情况下，需要采用最长递增子序列来确定稳定不变的组合，然后对不稳定的元素进行移动操作。遍历新节点集合中间部分的节点，过滤掉稳定节点集合中的节点，对不稳定节点进行移动操作，锚点就是当前倒叙遍历新节点集合中间部分中的节点的下一个节点对应的 dom

#### 虚拟节点更新的整体流程

1. 首先判断新旧节点类型是否相同：

   - 不同：直接替换整个节点
   - 相同：继续比对属性和子节点

2. 子节点更新有 9 种基本情况：

- 新节点无子节点 × (旧节点无子节点/有文本/有子节点数组)
- 新节点为文本 × (旧节点无子节点/有文本/有子节点数组)
- 新节点有子节点数组 × (旧节点无子节点/有文本/有子节点数组)

3. 当新旧节点都有子节点数组时，需要用 diff 算法处理，有三种实现：

#### 三种 Diff 算法比较

##### 简单 Diff:

- 双层循环遍历新旧节点
- 通过 key 判断节点是否可复用
- 需要移动时以当前节点的下一个兄弟节点为锚点
- 最后删除多余旧节点
- 性能一般，可能产生不必要的移动

##### 双端 Diff:

- 同时比较新旧节点的头头、尾尾、头尾、尾头四种情况
- 匹配成功则更新内容，根据需要移动位置
- 四种情况都不匹配时，尝试通过 key 在旧节点中查找
- 相比简单 Diff 减少了节点移动次数

##### 快速 Diff:

- 先处理头尾相同的节点
- 剩余中间部分有三种情况:
- 新节点多于旧节点:需要新增
- 新节点少于旧节点:需要删除
- 中间部分顺序不同:使用最长递增子序列算法优化移动
- 性能最优,是 Vue3 采用的方案

其实无论是简单 Diff 算法，还是双端 Diff 算法，抑或是快速 Diff 算法，它们都遵循同样的处理规则：

- 判断是否有节点需要移动，以及应该如何移动；
- 找出那些需要被添加或移除的节点。
