<script setup>
import * as Cesium from "cesium"
import { onMounted, ref, reactive } from "vue";
import { drawCircle, calc_two_point_distance, removeEntity } from "../utils/cesiumTools.js"
import Draw from "../utils/cesiumToolsClass.js";
let viewer = null,draw = null;
onMounted(() => {
  Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMjg5NDY0ZC1lOGEyLTQ2MGQtOTYwYS1jZGJhOTg0ZjkyM2QiLCJpZCI6MTQ0ODMyLCJpYXQiOjE2ODYwMzg3OTJ9.6k74rsx2Gxv0JhHqcKuspWSlwsQ193CKYI1vJrdj4jk"
  viewer = new Cesium.Viewer("map_box", {
    animation: false, // 动画小组件
    baseLayerPicker: true, // 底图组件，选择三维数字地球的底图（imagery and terrain）。
    fullscreenButton: false, // 全屏组件
    vrButton: true, // VR模式
    geocoder: false, // 地理编码（搜索）组件
    homeButton: false, // 首页，点击之后将视图跳转到默认视角
    infoBox: false, // 信息框
    sceneModePicker: false, // 场景模式，切换2D、3D 和 Columbus View (CV) 模式。
    selectionIndicator: false, // 是否显示选取指示器组件
    timeline: false, // 时间轴
    navigationHelpButton: false, // 帮助提示，如何操作数字地球。
    // 如果最初应该看到导航说明，则为true；如果直到用户明确单击该按钮，则该提示不显示，否则为false。
    navigationInstructionsInitiallyVisible: false,
  })
  console.log(viewer)
  // 去除版权信息
  viewer._cesiumWidget._creditContainer.style.display = "none";

  // let atLayer = new Cesium.UrlTemplateImageryProvider({url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  //   minimumLevel: 3,
  //   maximumLevel: 18,
  // });
  // viewer.imageryLayers.addImageryProvider(atLayer);

  // 漫游到位置
  viewer.camera.flyTo({
    // fromDegrees()方法，将经纬度和高程转换为世界坐标
    destination: Cesium.Cartesian3.fromDegrees(104.07, 30.66, 200.0),
    // orientation: {
    //   heading: 6.283185307179586,
    //   // 视角
    //   pitch: -1.5,
    //   roll: 0,
    // }
  });
  draw = new Draw(viewer, { borderColor: Cesium.Color.RED, material: Cesium.Color.BLUE.withAlpha(0.5) })  //viewer 初始化的cesium对象,自定义配置项，可以不用，就使用默认样式

  // viewer.imageryLayers.remove(viewer.imageryLayers.get(0));
  // viewer.imageryLayers.addImageryProvider(new Cesium.IonImageryProvider({assetId: 3954}))
})

function drawCircleF(){
  draw.drawCircle() //圆形区域
  // drawCircle(viewer, function(info){
  //   console.log("绘制完成，信息是：",info)
  // })
}
function removeEntityF(){
  // removeEntity(viewer)
  draw.removeEntity()
}
</script>

<template>
  <div>
    <div class="funs">
      <el-button type="primary" @click="drawCircleF">绘制圆</el-button>
      <el-button type="primary" @click="drawCircleF">绘制线</el-button>
      <el-button type="danger" @click="removeEntityF">删除</el-button>
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