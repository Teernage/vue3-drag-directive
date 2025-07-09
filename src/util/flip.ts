export const Flip = (function () {
  // 正在拖拽的元素类名
  let DRAGGING_CLASS: string = 'dragging';

  class FlipDom {
    private dom: HTMLElement; // 要执行 FLIP 动画的 DOM 元素
    private durationTime: string; // 动画持续时间
    private firstPosition: { x: number; y: number }; // 元素的初始位置
    private lastPosition: { x: number; y: number }; // 元素的最终位置
    private isPlaying: boolean; // 标记动画是否正在播放

    /**
     * 构造函数
     *
     * @param dom 需要操作的 DOM 元素
     * @param duration 动画持续时间，可以是数字（秒）或字符串（例如 '1s'、'0.5s'），默认为 0.5 秒
     */
    constructor(dom: HTMLElement, duration: number | string = 0.5) {
      this.dom = dom;
      this.durationTime =
        typeof duration === 'number' ? `${duration}s` : duration;
      this.firstPosition = this.getDomPosition();
      this.lastPosition = { x: 0, y: 0 };
      this.isPlaying = false;
    }

    /**
     * 获取DOM元素的位置
     *
     * @returns 包含x和y坐标的对象
     */
    private getDomPosition(): { x: number; y: number } {
      const rect = this.dom.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    }

    /**
     * 记录当前dom初始位置
     *
     */
    public recordFirst(): void {
      const firstPosition = this.getDomPosition();
      this.firstPosition.x = firstPosition.x;
      this.firstPosition.y = firstPosition.y;
    }

    /**
     * 记录DOM最后的位置
     */
    public recordLast(): void {
      const lastPosition = this.getDomPosition();
      this.lastPosition.x = lastPosition.x;
      this.lastPosition.y = lastPosition.y;
    }

    /**
     * 反转元素位置
     *
     * @returns 是否成功反转
     */
    private invert(): boolean {
      const deltaX = this.firstPosition.x! - this.lastPosition.x!;
      const deltaY = this.firstPosition.y! - this.lastPosition.y!;

      if (deltaX === 0 && deltaY === 0) {
        return false;
      }
      this.dom.style.transition = 'none';
      this.dom.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      // 对于非拖拽元素(即正在进行FLIP动画的元素)设置 pointer-events: none
      // 这样可以防止在拖拽过程中,其他正在运动的元素触发 dragenter/dragover 等拖拽相关事件
      if (!this.dom.classList.contains(DRAGGING_CLASS)) {
        this.dom.style.pointerEvents = 'none';
      }
      return true;
    }

    /**
     * 播放当前dom的动画
     *
     * @returns 返回一个Promise对象，当动画播放完毕后resolve
     */
    public play(): Promise<void> {
      return new Promise((resolve) => {
        if (this.isPlaying) {
          resolve();
          return;
        }

        let timer;
        this.isPlaying = true;
        let finished = false; // 防止多次执行

        this.recordLast();
        const isInverted: boolean = this.invert();

        if (isInverted === false) {
          this.reset();
          resolve();
          return;
        }

        /**  
         invert 函数将元素从目标位置移动回其原始位置。
         使用 raf 函数确保在下一帧中取消 transform 位移。
         如果在同一帧中处理，浏览器会立即应用最终状态，
         导致元素跳到结束位置，而没有预期的动画效果。
         */
        raf(() => {
          this.dom.style.transition = `transform ${this.durationTime}`;
          this.dom.style.transform = 'none';

          const onComplete = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer); //  transitionend 先触发时清除定时器
            this.reset();
            this.recordFirst();
            resolve();
          };
          /*
           'transitionend' 事件是在过渡动画完成后触发的。
           事件监听器是在当前帧注册的,而过渡动画是在下一帧执行的。
           所以我们可以监听 'transitionend' 事件,来检测过渡动画何时完成 
          */
          this.dom.addEventListener('transitionend', onComplete, {
            once: true,
          });

          // 兜底定时器
          const durationMs = parseFloat(this.durationTime) * 1000;
          timer = setTimeout(onComplete, durationMs + 50);
        });
      });
    }

    /**
     * 重置
     *
     * 将 DOM 元素的 pointerEvents、transition 和 transform 样式属性重置为空字符串，
     * 并将 isPlaying 属性设置为 false，表示当前dom的动画已停止播放。
     */
    reset() {
      this.dom.style.pointerEvents = '';
      this.dom.style.transition = '';
      this.dom.style.transform = '';
      this.isPlaying = false;
    }
  }

  class Flip {
    private flipDoms: Set<FlipDom>;
    public isAnimating: boolean;

    /**
     * 构造函数
     *
     * @param doms DOM元素数组
     * @param duration 动画持续时间，可以为数字或字符串（如"0.5s"），默认为0.5秒
     * @param draggingClass 可选参数，拖动时的CSS类名
     */
    constructor(
      doms: HTMLElement[],
      duration: number | string = 0.5,
      draggingClass?: string
    ) {
      this.flipDoms = new Set([...doms].map((it) => new FlipDom(it, duration)));
      if (draggingClass) {
        DRAGGING_CLASS = draggingClass;
      }
      this.isAnimating = false;
    }

    /**
     * 播放动画。
     *
     * @returns 无返回值，返回一个 Promise 对象，该对象在动画播放完成时解析。
     */
    public async play(): Promise<void> {
      this.isAnimating = true;
      // 同时播放所有dom的动画，就会形成一个元素结构的动画播放效果，即flip动画
      const promises = [...this.flipDoms].map((flipDom) => flipDom.play());
      await Promise.all(promises);
      this.isAnimating = false;
    }
  }

  return Flip;
})();

/**
 * 使用 requestAnimationFrame 方法在下一帧执行回调函数
 *
 * @param callBack 要执行的回调函数
 */
function raf(callBack: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callBack);
  });
}
