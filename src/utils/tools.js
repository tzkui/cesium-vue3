import {  Math as cesiumMath, Cartesian3 } from "cesium"

/**
 * 从当前坐标上获取3D笛卡尔坐标
 * @param {*} position 坐标（e.position）
 * @returns 
 */
export function getCatesian3FromPX(position) {
  const picks = window.viewer.scene.drillPick(position);
  window.viewer.render();
  let cartesian;
  let isOn3dtiles = false;
  for (let i = 0; i < picks.length; i++) {
    if (
      picks[i] &&
      picks[i].primitive &&
      picks[i] instanceof Cesium3DTileFeature
    ) {
      //模型上拾取
      isOn3dtiles = true;
      break;
    }
  }
  if (isOn3dtiles) {
    cartesian = window.viewer.scene.pickPosition(position, cartesian);
  } else {
    const ray = window.viewer.camera.getPickRay(position);
    if (!ray) return null;
    cartesian = window.viewer.scene.globe.pick(ray, window.viewer.scene);
  }
  return cartesian;
}

/**
 * 笛卡尔坐标转经纬度
 * @param {*} cartesian 笛卡尔坐标数据
 * @returns 
 */
export function cartesianToLonlat(cartesian) {
  const lonLat = window.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
  const lat = cesiumMath.toDegrees(lonLat.latitude);
  const lng = cesiumMath.toDegrees(lonLat.longitude);
  return [lng, lat];
}


/**
 * 经纬度坐标转笛卡尔
 * @param {Array} lonLat 经纬度数组 
 * @returns 
 */
export function lonLatToCartesian(lonLat) {
  const cartesian = Cartesian3.fromDegrees(lonLat[0], lonLat[1]);
  return cartesian;
}