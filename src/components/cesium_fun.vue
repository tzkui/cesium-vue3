<script setup>
import * as Cesium from "cesium"
import { onMounted, ref, reactive, nextTick } from "vue";
import {
  drawLine,
  drawLine3d,
  drawCircle,
  calc_two_point_distance,
  removeEntity,
  drawArea
} from "../utils/cesiumTools.js"
import { drawPoint } from '../utils/draws/point'
import { airplane, buildings } from "../utils/study"
const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMjg5NDY0ZC1lOGEyLTQ2MGQtOTYwYS1jZGJhOTg0ZjkyM2QiLCJpZCI6MTQ0ODMyLCJpYXQiOjE2ODYwMzg3OTJ9.6k74rsx2Gxv0JhHqcKuspWSlwsQ193CKYI1vJrdj4jk"
onMounted(async () => {
  Cesium.Ion.defaultAccessToken = access_token;
  window.viewer = new Cesium.Viewer("map_box", {
    animation: true, // * 左下角圆盘 速度控制器
    shouldAnimate: true, // * 当动画控件出现，用来控制是否通过旋转控件，旋转场景
    baseLayerPicker: false, // * 右上角图层选择器
    fullscreenButton: false, // * 右下角全屏按钮
    vrButton: false, // * 右下角vr按钮
    homeButton: false, // * 右上角地图恢复到初始页面按钮
    selectionIndicator: false, // * 点击后地图上显示的选择控件
    infoBox: false, // * 右上角鼠标点击后信息展示框
    sceneModePicker: false, // * 右上角2D和3D之间的切换
    timeline: true, // * 页面下方的时间条
    navigationHelpButton: false, // * 右上角帮助按钮
    navigationInstructionsInitiallyVisible: false, // * 是否展开帮助
    scene3DOnly: true, // * 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    useDefaultRenderLoop: true, // * 控制渲染循环
    showRenderLoopErrors: false, // * HTML面板中显示错误信息
    useBrowserRecommendedResolution: true, // * 如果为true，则以浏览器建议的分辨率渲染并忽略window.devicePixelRatio
    automaticallyTrackDataSourceClocks: true, // * 自动追踪最近添加的数据源的时钟设置
    orderIndependentTranslucency: true, // * 如果为true并且配置支持它，则使用顺序无关的半透明性
    shadows: false, // * 阴影效果
    projectionPicker: false, // * 透视投影和正投影之间切换
    requestRenderMode: true, // * 在指定情况下进行渲染,提高性能
    terrainProvider: await Cesium.createWorldTerrainAsync(),
  })
  // 去除版权信息
  window.viewer._cesiumWidget._creditContainer.style.display = "none";

  // 开启深度检测，不然画的线面会飘在模型表面（即这样才能获取到高度）
  window.viewer.scene.globe.depthTestAgainstTerrain = true;
  // let atLayer = new Cesium.UrlTemplateImageryProvider({url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  //   minimumLevel: 3,
  //   maximumLevel: 18,
  // });
  // viewer.imageryLayers.addImageryProvider(atLayer);
  setTimeout(() => {
    // 漫游到位置
    window.viewer.camera.flyTo({
      // fromDegrees()方法，将经纬度和高程转换为世界坐标
      destination: Cesium.Cartesian3.fromDegrees(86.889, 27.991, 10000),
      // orientation: {
      //   heading: 6.283185307179586,
      //   // 视角
      //   pitch: -1.5,
      //   roll: 0,
      // }
    });
  }, 500)
})

function drawCircleF() {
  drawCircle(window.viewer, function (info) {
    console.log("绘制完成，信息是：", info)
  })
}
function removeEntityF() {
  removeEntity(window.viewer)
}
function drawLineF() {
  // drawLine(viewer, function (res) {
  //   console.log(res)
  // })
  drawLine3d(window.viewer, function (res) { })
}
function drawAreaF() {
  drawArea(window.viewer, function (res) {
    console.log("数据：", res)
  })
}
function airplaneF() {
  airplane(window.viewer)
}
function buildingsF() {
  buildings(window.viewer)
}
function drawPointF(){
  const option={
    imgUrl: "/src/assets/images/mark.png"
  }
  drawPoint(option,function(res){
    console.log(res)
  })
}
</script>

<template>
  <div>
    <div class="funs">
      <el-button type="primary" @click="drawPointF">点标绘</el-button>
      <el-button type="primary" @click="drawCircleF">绘制圆</el-button>
      <el-button type="primary" @click="drawLineF">绘制线</el-button>
      <el-button type="primary" @click="drawAreaF">绘制面</el-button>
      <el-button type="danger" @click="removeEntityF">删除</el-button>
      <el-button type="danger" @click="airplaneF">芜湖起飞</el-button>
      <el-button type="danger" @click="buildingsF">建筑</el-button>
    </div>
    <div id="map_box"></div>
  </div>
</template>

<style lang="less" scoped>
#map_box {
  width: 90vw;
  height: 90vh;
}
</style>