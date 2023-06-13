import * as Cesium from "cesium"
import { cartesianToLonlat } from './tools.js'
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

export const drawLine3d = function (viewer, cb) {

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  let totalPosition = [], movePosition = [], activitePosition;
  let pointList = [];
  let createLineEntity = function () {
    return viewer.entities.add({
      polyline: new Cesium.PolylineGraphics({
        positions: new Cesium.CallbackProperty(function () {
          return pointList;
        }, false),
        show: true,
        material: Cesium.Color.BLUE,
        width: 5,
        clampToGround: true,
        followSurface: false,
      })
    })
  }
  // 左键点击事件
  handler.setInputAction(function (e) {
    let positions = viewer.scene.pickPosition(e.position);
    if (totalPosition.length === 0) {
      activitePosition = new Cesium.CallbackProperty(function () {
        return movePosition
      }, false)
    }
    pointList.push(positions.clone())
    viewer.entities.add({
      position: positions,
      point: {
        pixelSize: 5,
        color: Cesium.Color.BLUE,
        outlineColor: Cesium.CallbackProperty.RED,
        outerWidth: 1,
      }
    })
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 鼠标移动事件
  handler.setInputAction(function (e) {
    let cartesian = viewer.scene.pickPosition(e.endPosition);
    if (pointList.length === 1) {
      pointList.push(cartesian.clone());
    } else if (pointList.length === 2) {
      createLineEntity()
    }
    if (pointList.length >= 2) {
      pointList.pop();
      pointList.push(cartesian.clone())
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  // 鼠标右键取消绘制
  handler.setInputAction(function (e) {
    handler.destroy();
    showPrimitiveOnMap()
    cb && cb(pointList)
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  let showPrimitiveOnMap = function () {
    const instance = new Cesium.GeometryInstance({
      id: new Date().getTime(),
      geometry: new Cesium.GroundPolylineGeometry({
        positions: pointList,
      })
    })
    return viewer.scene.groundPrimitives.add(
      new Cesium.GroundPolylinePrimitive({
        geometryInstances: instance,
        appearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType("PolylineOutline", {
            outlineWidth: 5,
          })
        })
      })
    )
  }
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
  let pointList = [];
  let radius = 0;
  let id = new Date().getTime();
  console.log(id)
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  const createCircleEntity = () => {
    const update = function () {
      if (pointList.length === 2) {
        return pointList[0]
      }
    }
    const computeDistance = () => {
      return Cesium.Cartesian3.distance(pointList[0], pointList[1])
    }
    return viewer.entities.add({
      position: new Cesium.CallbackProperty(update, false),
      id: id,
      ellipse: {
        material: Cesium.Color.BLUE,
        clampToGround: true,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        semiMajorAxis: new Cesium.CallbackProperty(computeDistance, false),
        semiMinorAxis: new Cesium.CallbackProperty(computeDistance, false),
        outline: true,
        outlineColor: Cesium.Color.BLUE,
        outlineWidth: 5,
      }
    })
  }
  let showPrimitiveOnMap = function () {
    const distance = Cesium.Cartesian3.distance(pointList[0], pointList[1])
    const instance = new Cesium.GeometryInstance({
      id: new Date().getTime(),
      geometry: new Cesium.EllipseGeometry({
        center: pointList[0],
        semiMajorAxis: distance,
        semiMinorAxis: distance
      })
    })
    const primitive = viewer.scene.groundPrimitives.add(
      new Cesium.GroundPrimitive({
        geometryInstances: instance,
        appearance: new Cesium.Appearance({
          material: Cesium.Material.fromType("Color", {
            color: Cesium.Color.PINK.clone(),
          }),
        })
      })
    )
    return primitive;
  };
  let cartesian, cartesian1;
  handler.setInputAction((click) => {
    cartesian = viewer.scene.pickPosition(click.position);
    pointList.push(cartesian.clone())
    createCircleEntity()
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  handler.setInputAction((move) => {
    if (pointList.length > 0) {
      cartesian1 = viewer.scene.pickPosition(move.endPosition);
      pointList.splice(1, 1, cartesian1.clone())
      radius = Cesium.Cartesian3.distance(cartesian, cartesian1)
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  handler.setInputAction(() => {
    let info = { id: id, center: pointList[0], radius: radius }
    infoDetail.circle.push(info)
    showPrimitiveOnMap()
    handler.destroy();
    cb && cb(info)
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

// 绘制面
export const drawArea = function (viewer) {
  let activeShapePoints = [];
  let activeShape, floatingPoint;
  function createPoint(worldPosition) {
    const point = viewer.entities.add({
      position: worldPosition,
      point: {
        color: Cesium.Color.BLUE,
        pixelSize: 5,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    return point;
  }
  function drawShape(positionData) {
    let shape = viewer.entities.add({
      polygon: {
        hierarchy: positionData,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.BLUE.withAlpha(0.7)
        ),
      },
    });
    return shape;
  }
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  handler.setInputAction((event) => {
    const ray = viewer.camera.getPickRay(event.position);
    const earthPosition = viewer.scene.globe.pick(ray, viewer.scene);
    if (Cesium.defined(earthPosition)) {
      if (activeShapePoints.length === 0) {
        floatingPoint = createPoint(earthPosition);
        activeShapePoints.push(earthPosition);
        const dynamicPositions = new Cesium.CallbackProperty(function () {
          return new Cesium.PolygonHierarchy(activeShapePoints);
        }, false)
        activeShape = drawShape(dynamicPositions);
      }
      activeShapePoints.push(earthPosition);
      createPoint(earthPosition)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  handler.setInputAction((event) => {
    if (Cesium.defined(floatingPoint)) {
      const ray = viewer.camera.getPickRay(event.endPosition);
      const newPosition = viewer.scene.globe.pick(ray, viewer.scene);
      if (Cesium.defined(newPosition)) {
        floatingPoint.position.setValue(newPosition);
        activeShapePoints.pop();
        activeShapePoints.push(newPosition);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  handler.setInputAction((event)=>{
    activeShapePoints.pop();
    drawShape(activeShapePoints);
    viewer.entities.remove(floatingPoint);
    viewer.entities.remove(activeShape);
    floatingPoint = undefined;
    activeShape = undefined;
    activeShapePoints = [];
  },Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

// 突击方向
export const assaultDirection = function (viewer, cb) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  let pointList = [];
  const createEntity = function () {
    const update = () => {
      const lnglatArr = [];
      for (const point of pointList) {
        lnglatArr.push(cartesianToLonlat(point))
      }
      const n = lnglatArr.length;
      if (n === 2) {
        lnglatArr.push(lnglatArr[1][0] + 0.0000001, lnglatArr[1][1]);
      } else if (
        lnglatArr[n - 1].toString() === lnglatArr[n - 2].toString()
        && lnglatArr.length > 3
      ) {
        lnglatArr.pop()
      } else {
        lnglatArr[n - 1][0] += 0.0000001;
      }
      const res = Cesium.arrow
    }
  }
  handler.setInputAction(e => {
    const cartesian = viewer.scene.pickPosition(e.position);
    if (!cartesian) return;
    pointList.push(cartesian.clone());
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  handler.setInputAction(e => {
    const cartesian = viewer.scene.pickPosition(e.position);
    if (!cartesian) return;
    if (pointList.length === 1) {
      pointList.push(cartesian.clone());
      createEntity()
    }

  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
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
    console.log(pick, viewer.entities)
    if (pick?.id?.id) {
      document.body.style.cursor = "pointer";
      handler.setInputAction((click) => {
        viewer.entities.remove(pick.id);
        cb && cb()
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}
