import * as Cesium from "cesium"

import airplane_track from "./mocks/airplane_track"

export const airplane = function (viewer) {
  const dataPoint = { longitude: -122.38985, latitude: 37.61864, height: -27.32 };
  // Mark this location with a red point.
  const pointEntity = viewer.entities.add({
    description: `First data point at (${dataPoint.longitude}, ${dataPoint.latitude})`,
    position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height),
    point: { pixelSize: 10, color: Cesium.Color.RED }
  });
  // Fly the camera to this point.
  viewer.flyTo(pointEntity);
  const osmBuildings = viewer.scene.primitives.add(Cesium.createOsmBuildings());
  const flightData = JSON.parse(airplane_track);
  // Create a point for each.
  const timeStepInSeconds = 30;
  const totalSeconds = timeStepInSeconds * (flightData.length - 1);
  const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z");
  const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.timeline.zoomTo(start, stop);
  // Speed up the playback speed 50x.
  viewer.clock.multiplier = 50;
  // Start playing the scene.
  viewer.clock.shouldAnimate = true;

  // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
  const positionProperty = new Cesium.SampledPositionProperty();

  for (let i = 0; i < flightData.length; i++) {
    const dataPoint = flightData[i];

    // Declare the time for this individual sample and store it in a new JulianDate instance.
    const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate());
    const position = Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height);
    // Store the position along with its timestamp.
    // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
    positionProperty.addSample(time, position);

    viewer.entities.add({
      description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
      position: position,
      point: { pixelSize: 10, color: Cesium.Color.RED }
    });
  }

  // STEP 4 CODE (green circle entity)
  // Create an entity to both visualize the entire radar sample series with a line and add a point that moves along the samples.
  async function loadModel() {
    // Load the glTF model from Cesium ion.
    const airplaneUri = await Cesium.IonResource.fromAssetId("1805672");
    const airplaneEntity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: start, stop: stop })]),
      position: positionProperty,
      // Attach the 3D model instead of the green point.
      model: { uri: airplaneUri },
      // Automatically compute the orientation from the position.
      orientation: new Cesium.VelocityOrientationProperty(positionProperty),
      path: new Cesium.PathGraphics({ width: 3 })
    });

    viewer.trackedEntity = airplaneEntity;
  }

  loadModel();
}

export const buildings = function (viewer) {
  const buildingsTileset = viewer.scene.primitives.add(Cesium.createOsmBuildings());
  // Fly the camera to Denver, Colorado at the given longitude, latitude, and height.
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-104.9965, 39.74248, 4000)
  }); 
  async function addBuildingGeoJSON() {
    // Load the GeoJSON file from Cesium ion.
    const geoJSONURL = await Cesium.IonResource.fromAssetId(1806044);
    // Create the geometry from the GeoJSON, and clamp it to the ground.
    const geoJSON = await Cesium.GeoJsonDataSource.load(geoJSONURL, { clampToGround: true });
    // Add it to the scene.
    const dataSource = await viewer.dataSources.add(geoJSON);
    // By default, polygons in CesiumJS will be draped over all 3D content in the scene.
    // Modify the polygons so that this draping only applies to the terrain, not 3D buildings.
    for (const entity of dataSource.entities.values) {
      entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
    }
    // Move the camera so that the polygon is in view.
    viewer.flyTo(dataSource);
    const newBuildingTileset = viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(1806127)
      })
    );
    // Move the camera to the new building.
    viewer.flyTo(newBuildingTileset);
    // 切换建筑的显示与隐藏
    function toggleBuilding(){
      newBuildingTileset.show = !newBuildingTileset.show;
    }
  }
  addBuildingGeoJSON();
}