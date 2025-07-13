import Theme from '@escook/vitepress-theme'
import '@escook/vitepress-theme/style.css'
import mediumZoom from 'medium-zoom'
import { onMounted } from 'vue'
import 'medium-zoom/dist/style.css'
import './custom.css'  // 如果你有自定义样式  

export default {
  ...Theme,
  enhanceApp({ app, router }) {
    // 其他增强功能...  
  },
  setup() {
    onMounted(() => {
      mediumZoom('img:not(.no-zoom)', {
        background: 'var(--vp-c-bg)',
        margin: 50,  // 调整边距以间接改变缩放效果  
        scrollOffset: 0
      })
    })
  }
}