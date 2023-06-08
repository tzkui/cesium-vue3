<script setup>
import * as Cesium from "cesium"
import { onMounted, ref, reactive, nextTick } from "vue";
import {
  drawLine,
  drawCircle,
  calc_two_point_distance,
  removeEntity,
} from "../utils/cesiumTools.js"
import { airplane, buildings } from "../utils/study"
const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMjg5NDY0ZC1lOGEyLTQ2MGQtOTYwYS1jZGJhOTg0ZjkyM2QiLCJpZCI6MTQ0ODMyLCJpYXQiOjE2ODYwMzg3OTJ9.6k74rsx2Gxv0JhHqcKuspWSlwsQ193CKYI1vJrdj4jk"
let viewer = null;
onMounted(() => {
  Cesium.Ion.defaultAccessToken = access_token;
  viewer = new Cesium.Viewer("map_box", {
    // animation: false, // 动画小组件
    // baseLayerPicker: true, // 底图组件，选择三维数字地球的底图（imagery and terrain）。
    // fullscreenButton: false, // 全屏组件
    // vrButton: false, // VR模式
    // geocoder: false, // 地理编码（搜索）组件
    // homeButton: false, // 首页，点击之后将视图跳转到默认视角
    // infoBox: false, // 信息框
    // sceneModePicker: false, // 场景模式，切换2D、3D 和 Columbus View (CV) 模式。
    // selectionIndicator: false, // 是否显示选取指示器组件
    // timeline: false, // 时间轴
    // navigationHelpButton: false, // 帮助提示，如何操作数字地球。
    // // 如果最初应该看到导航说明，则为true；如果直到用户明确单击该按钮，则该提示不显示，否则为false。
    // navigationInstructionsInitiallyVisible: false,
    terrainProvider: Cesium.createWorldTerrain()
  })
  console.log(viewer)
  // 去除版权信息
  viewer._cesiumWidget._creditContainer.style.display = "none";

  // let atLayer = new Cesium.UrlTemplateImageryProvider({url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  //   minimumLevel: 3,
  //   maximumLevel: 18,
  // });
  // viewer.imageryLayers.addImageryProvider(atLayer);
  setTimeout(() => {
    // 漫游到位置
    viewer.camera.flyTo({
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
  drawCircle(viewer, function (info) {
    console.log("绘制完成，信息是：", info)
  })
}
function removeEntityF() {
  removeEntity(viewer)
}
function drawLineF() {
  drawLine(viewer, function (res) {
    console.log(res)
  })
}
function airplaneF() {
  airplane(viewer)
}
function buildingsF() {
  buildings(viewer)
}
</script>

<template>
  <div>
    <div class="funs">
      <el-button type="primary" @click="drawCircleF">绘制圆</el-button>
      <el-button type="primary" @click="drawLineF">绘制线</el-button>
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