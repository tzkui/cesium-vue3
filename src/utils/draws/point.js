import * as Cesium from "cesium"
import { getCatesian3FromPX } from '../tools.js'

export const drawPoint = function (option, cb) {
  const { imgUrl } = option
  const canvas = window.viewer.scene.canvas;
  const billboards = window.viewer.scene.primitives.add(new Cesium.BillboardCollection({
    scene: window.viewer.scene
  }));

  const handler = new Cesium.ScreenSpaceEventHandler(canvas);
  handler.setInputAction((e) => {
    const entity = window.viewer.scene.pick(e.position);
    if(Cesium.defined(entity)){
      console.log(entity)
    }else{
      const cartesian = getCatesian3FromPX(e.position);
      if (!cartesian) return;
      console.log(window.viewer)
      billboards.add({
        position: cartesian,
        id: new Date().getTime()+"1111",
        type: "123",
        image: imgUrl,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      })
      handler.destroy()
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}