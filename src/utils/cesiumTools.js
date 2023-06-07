import * as Cesium from "cesium"

/**
 * 计算两点的位置
 * @param {Object} point1 第一个点的信息
 * @param {*} point2 第二个点的信息
 * 这两个都是对象，里面应该有3个属性，lon（经度），lat（纬度）和height（高度）
 * @returns 两点的距离，单位为米,且向下取整
 */
export const calc_two_point_distance = function (point1, point2) {
  const position1 = Cesium.Cartesian3.fromDegrees(point1.lon, point1.lat, point1.height);
  const position2 = Cesium.Cartesian3.fromDegrees(point2.lon, point2.lat, point2.height);
  return parseInt(Cesium.Cartesian3.distance(position1, position2));
}

const infoDetail = { point: [], line: [], rectangle: [], circle: [], planeSelf: [] }
const baseConfig = {
  borderColor: Cesium.Color.BLUE,
  borderWidth: 2,
  material: Cesium.Color.GREEN.withAlpha(0.5),
}

/**
 * 画线
 * @param {*} viewer 
 * @param {*} cb 
 */
export const drawLine = function (viewer, cb) {
  if (!(viewer instanceof Cesium.Viewer)) {
    throw new Error("请传入viewer")
  }
  /**实体的唯一标注 */
  let id = null
  /**记录拐点坐标 */
  let positions = [],
    /**记录返回结果 */
    codeInfo = [],
    /**面的hierarchy属性 */
    polygon = new Cesium.PolygonHierarchy(),
    _polygonEntity = new Cesium.Entity(),
    /**面对象配置 */
    polyObj = null;
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  // 鼠标左键点击
  handler.setInputAction((click) => {
    id = new Date().getTime();
    let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian, viewer.scene.globe.ellipsoid, new Cesium.Cartographic())
    let lon = Cesium.Math.toDegrees(cartographic.longitude)
    let lat = Cesium.Math.toDegrees(cartographic.latitude)
    console.log(cartesian)
    if (cartesian && cartesian.x) {
      if (positions.length === 0) {
        positions.push(cartesian.clone())
      }
      codeInfo.push([lon, lat])
      positions.push(cartesian.clone());
      polygon.positions.push(cartesian.clone())
      if (!polyObj) {
        _polygonEntity.polyline = {
          width: baseConfig.borderWidth,
          material: baseConfig.borderColor,
          clampToGround: false,
          positions: new Cesium.CallbackProperty(function () {
            return positions
          }, false)
        }
        _polygonEntity.name = "line";
        _polygonEntity._id = id;
        polyObj = viewer.entities.add(_polygonEntity)
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  // 鼠标移动
  handler.setInputAction((movement) => {
    let cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian, viewer.scene.globe.ellipsoid, new Cesium.Cartographic())
    let lon = Cesium.Math.toDegrees(cartographic.longitude)
    let lat = Cesium.Math.toDegrees(cartographic.latitude)
    if (positions.length > 0) {
      if (cartesian && cartesian.x) {
        positions.pop();
        positions.push(cartesian);
        codeInfo.pop();
        codeInfo.push([lon, lat]);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  // 鼠标右键停止画线
  handler.setInputAction((click) => {
    infoDetail.line.push({ id: id, positions: codeInfo })
    handler.destroy();
    cb && cb(codeInfo)
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

/**
 * 绘制圆形
 * @param {*} viewer  viewer实例
 * @param {*} cb   回调函数 
 * @returns 
 */
export const drawCircle = function (viewer, cb) {
  if (!(viewer instanceof Cesium.Viewer)) {
    throw new Error("请传入viewer")
  }
  let lonLat = [], id = "";
  let radius = 0
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click) => {
    id = new Date().getTime();
    let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian, viewer.scene.globe.ellipsoid, new Cesium.Cartographic())
    let lon = Cesium.Math.toDegrees(cartographic.longitude)
    let lat = Cesium.Math.toDegrees(cartographic.latitude)
    lonLat = [lon, lat];
    let entity = viewer.entities.add({
      position: new Cesium.CallbackProperty(function () { return new Cesium.Cartesian3.fromDegrees(...lonLat, 0) }, false),
      name: 'circle',
      id: id,
      ellipse: {
        material: baseConfig.material,
        outlineColor: baseConfig.borderColor,
        outlineWidth: baseConfig.borderWidth,
        height: 0,
        outline: true,
      }
    })
    entity.ellipse.semiMajorAxis = new Cesium.CallbackProperty(function () { return radius }, false)
    entity.ellipse.semiMinorAxis = new Cesium.CallbackProperty(function () { return radius }, false)
    if (lonLat) {
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
    handler.setInputAction((move) => {
      let cartesian2 = viewer.camera.pickEllipsoid(move.endPosition, viewer.scene.globe.ellipsoid)
      radius = Cesium.Cartesian3.distance(cartesian, cartesian2)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  handler.setInputAction(() => {
    let info = { id: id, center: lonLat, radius: radius }
    infoDetail.circle.push(info)
    handler.destroy();
    cb && cb(info)
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}


/**
 * 删除实体对象
 * @param {*} viewer viewer实例
 * @param {*} cb 回调函数
 */
export const removeEntity = function (viewer, cb) {
  if (!(viewer instanceof Cesium.Viewer)) {
    throw new Error("请传入viewer")
  }
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (move) {
    let pick = viewer.scene.pick(move.endPosition);
    if (pick?.id?.id) {
      document.body.style.cursor = "pointer";
      handler.setInputAction((click) => {
        viewer.entities.remove(pick.id);
        cb && cb()
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

export const drawLine_3d = function(viewer,cb){
  if (!(viewer instanceof Cesium.Viewer)) {
    throw new Error("请传入viewer")
  }
  /**实体的唯一标注 */
  let id = null
  /**记录拐点坐标 */
  let positions = [],
    /**记录返回结果 */
    codeInfo = [],
    /**面的hierarchy属性 */
    polygon = new Cesium.PolygonHierarchy(),
    _polygonEntity = new Cesium.Entity(),
    /**面对象配置 */
    polyObj = null;
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  // 鼠标左键点击
  handler.setInputAction((click) => {
    id = new Date().getTime();
    let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian, viewer.scene.globe.ellipsoid, new Cesium.Cartographic())
    let lon = Cesium.Math.toDegrees(cartographic.longitude)
    let lat = Cesium.Math.toDegrees(cartographic.latitude)
    console.log(cartesian)
    if (cartesian && cartesian.x) {
      if (positions.length === 0) {
        positions.push(cartesian.clone())
      }
      codeInfo.push([lon, lat])
      positions.push(cartesian.clone());
      polygon.positions.push(cartesian.clone())
      if (!polyObj) {
        _polygonEntity.polyline = {
          width: baseConfig.borderWidth,
          material: baseConfig.borderColor,
          clampToGround: false,
          positions: new Cesium.CallbackProperty(function () {
            return positions
          }, false)
        }
        _polygonEntity.name = "line";
        _polygonEntity._id = id;
        polyObj = viewer.entities.add(_polygonEntity)
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  // 鼠标移动
  handler.setInputAction((movement) => {
    let cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian, viewer.scene.globe.ellipsoid, new Cesium.Cartographic())
    let lon = Cesium.Math.toDegrees(cartographic.longitude)
    let lat = Cesium.Math.toDegrees(cartographic.latitude)
    if (positions.length > 0) {
      if (cartesian && cartesian.x) {
        positions.pop();
        positions.push(cartesian);
        codeInfo.pop();
        codeInfo.push([lon, lat]);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  // 鼠标右键停止画线
  handler.setInputAction((click) => {
    infoDetail.line.push({ id: id, positions: codeInfo })
    handler.destroy();
    cb && cb(codeInfo)
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}