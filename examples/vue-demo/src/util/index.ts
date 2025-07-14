/**
 * 判断两个值是否相等
 *
 * @param x 待比较的第一个值
 * @param y 待比较的第二个值
 * @returns 如果 x 和 y 相等，则返回 true；否则返回 false
 *
 * @template TType 泛型参数，表示 x 和 y 的类型
 */
export const isEqual = <TType>(x: TType, y: TType): boolean => {
  if (Object.is(x, y)) return true;
  if (x instanceof Date && y instanceof Date) {
    return x.getTime() === y.getTime();
  }
  if (x instanceof RegExp && y instanceof RegExp) {
    return x.toString() === y.toString();
  }
  if (
    typeof x !== 'object' ||
    x === null ||
    typeof y !== 'object' ||
    y === null
  ) {
    return false;
  }
  const keysX = Reflect.ownKeys(x as unknown as object) as (keyof typeof x)[];
  const keysY = Reflect.ownKeys(y as unknown as object);
  if (keysX.length !== keysY.length) return false;
  for (let i = 0; i < keysX.length; i++) {
    if (!Reflect.has(y as unknown as object, keysX[i])) return false;
    if (!isEqual(x[keysX[i]], y[keysX[i]])) return false;
  }
  return true;
};
