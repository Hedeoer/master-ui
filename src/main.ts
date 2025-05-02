import { createApp } from 'vue'
import App from './App.vue'

import { setupGlobalDirectives } from './directives'
import { setupRouter } from './router'
import { setupStore } from './store'

import 'element-plus/theme-chalk/dark/css-vars.css'
// 确保防火墙样式在应用启动时加载
import './styles/firewall-preload.css'
import './styles/index.css'
import './styles/firewall.css'
// 导入内联样式加载器
import './styles/firewall-inline.ts'

const app = createApp(App)
// 配置store
setupStore(app)
// 配置router
setupRouter(app)
// 配置全局指令
setupGlobalDirectives(app)
app.mount('#app')
