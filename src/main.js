import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'cesium/Build/Cesium/Widgets/widgets.css';
const app = createApp(App);
app.use(ElementPlus);
app.mount("#app")