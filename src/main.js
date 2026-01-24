import { createApp } from 'vue'
import * as Pinia from 'pinia'
import { createUnistorage } from 'pinia-plugin-unistorage'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
const app = createApp(App)
const store = Pinia.createPinia()
// 关键代码
store.use(createUnistorage())
app.use(store)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
