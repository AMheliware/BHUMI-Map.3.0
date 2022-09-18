import "./style.css";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { Vector3 } from "three";
import * as Geo from "./engine/Main";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as dat from "lil-gui";
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterControls } from './characterControls';
import { KeyDisplay } from './utils';
declare var OSMBuildings:any

var onclickPoint: boolean = false
var onclickLine: boolean = false
var onclickPolygon: boolean = false
let ctrlDown: boolean = false
let currentLine: Array<Array<number>> = [];
let smokeParticles: Array<any> = [];
const mixers: any = [];

var clock = new THREE.Clock();

const droneFlyPath = {
  geometry: {
    type: "LineString",
    coordinates: [
      [8579083.523967698, 200, -3305289.6114165676],
      [8589083.523967698, 200, -3315289.6114165676],
      [8571183.523967698, 200, -3309289.6114165676],
      [8599083.523967698, 200, -3385289.6114165676],
      [8519083.523967698, 200, -3309289.6114165676],
    ],
  },
}


const points = droneFlyPath.geometry.coordinates.map((e) => {
  const [t, r, s] = e;
  return new THREE.Vector3(t, r, s);
});

let curve = new THREE.CatmullRomCurve3(points)
const params = {
  showRGBTerrain: false, // RGB Tile
  showSatellite: true, // Satellite Tile
  BuildingsData: false,
  elevationExaggeration: 1,
  latitude: 0, // x
  longitude: 0, // y
  elevation: 0, // z
  level: 0,
  point: function () {
    if (onclickPoint) {
      if (onclickLine) {
        window.removeEventListener("dblclick", onLine, true)
      } else if (onclickPolygon) {
            window.removeEventListener("dblclick", onPolygon, true)
      }
      onclickPoint = true
      window.addEventListener("click", onPoint, true)
    } else {
      onclickPoint = true
      window.addEventListener("click", onPoint, true)
    }
  },
  line: function () {
    if (onclickLine) {
      if (onclickPoint) {
        window.removeEventListener("click", onPoint, true)
      } else if (onclickPolygon) {
          window.removeEventListener("dblclick", onPolygon, true)
      }
      onclickLine = true
      window.addEventListener("dblclick", onLine, true)
    } else {
      onclickLine = true
      window.addEventListener("dblclick", onLine, true);
    }
  },
  polygon: function () {
    if (onclickLine) {
      if (onclickPoint) {
        window.removeEventListener("click", onPoint, true)
      } else if (onclickLine) {
          window.removeEventListener("dblclick", onLine, true)
      }
      onclickPolygon = true
      window.addEventListener("dblclick", onPolygon, true)
    } else {
      onclickPolygon = true
      window.addEventListener("dblclick", onPolygon, true);
    }
  }
};

function onLine(ev: any) {
  ctrlDown = false
  pointer.x = (ev.clientX / sizes.width) * 2 - 1;
  pointer.y = -(ev.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections.length > 0) {
    const face = intersections[0].face;
    if (face) {
      helper.lookAt(face.normal);
    }
    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0xaa0000,
        transparent: true,
        opacity: 0.9,
      })
    );
    sphere.position.copy(intersections[0].point);
    scene.add(sphere);
    currentLine.push([
      intersections[0].point.x,
      intersections[0].point.y,
      intersections[0].point.z,
    ]);

    if (currentLine.length > 1) {
      let vecArr: any = [];
      currentLine.map((p) => {
        vecArr.push(new Vector3(p[0], p[1], p[2]));
      });
      const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
      const geometry = new THREE.BufferGeometry().setFromPoints(vecArr);

      const lineM = new THREE.Line(geometry, material);
      lineM.name = "Line";
      // if(scene.getObjectByName("Line"))
      scene.add(lineM);
    }
  }


  window.addEventListener("contextmenu", (ev: any) => {
    // addLineString(ev)
    if (currentLine.length > 1) {
      let vecArr: any = [];
      // let coors = [];
      currentLine.map((p) => {
        vecArr.push(new Vector3(p[0], p[1], p[2]));
      });
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const geometry = new THREE.BufferGeometry().setFromPoints(vecArr);
      const lineM = new THREE.Line(geometry, material);
      scene.add(lineM);
      currentLine = [];
    }
  });
}

function onPoint(ev: any) {
  ctrlDown = false
  pointer.x = (ev.clientX / sizes.width) * 2 - 1;
  pointer.y = -(ev.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections.length > 0) {
    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(11, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0xaa0000,
        transparent: true,
        opacity: 0.9,
      })
    );
    sphere.position.copy(intersections[0].point);
    scene.add(sphere);
  }
}

function onPolygon(ev: any) {
  ctrlDown = false
  pointer.x = (ev.clientX / sizes.width) * 2 - 1;
  pointer.y = -(ev.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections.length > 0) {
    const face = intersections[0].face;
    if (face) {
      helper.lookAt(face.normal);
    }
    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0xaa0000,
        transparent: true,
        opacity: 0.9,
      })
    );
    sphere.position.copy(intersections[0].point);
    scene.add(sphere);
    currentLine.push([
      intersections[0].point.x,
      intersections[0].point.y,
      intersections[0].point.z,
    ]);

    if (currentLine.length > 1) {
      let vecArr: any = [];
      currentLine.map((p) => {
        vecArr.push(new Vector3(p[0], p[1], p[2]));
      });
      const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
      const geometry = new ConvexGeometry(vecArr);

      const lineM = new THREE.Mesh(geometry, material);
      lineM.name = "Line";
      // if(scene.getObjectByName("Line"))
      scene.add(lineM);
    }
  }


  window.addEventListener("contextmenu", (ev: any) => {
    // addLineString(ev)
    if (currentLine.length > 1) {
      let vecArr: any = [];
      currentLine.map((p) => {
        vecArr.push(new Vector3(p[0], p[1], p[2]));
        // let lnglat = self.localToMap(p[0],p[1]);
        // coors.push([lnglat.longitude,lnglat.latitude]);
      });
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const geometry = new ConvexGeometry(vecArr);
      const polygonM = new THREE.Mesh(geometry, material);
      scene.add(polygonM);
      currentLine = [];
    }
  });
}

const gui = new dat.GUI();
gui.add(params, "latitude").name("Latitude");
gui.add(params, "longitude").name("Longitude");
gui.add(params, "elevation").name("Elevation");
gui.add(params, "level").name("Zoom Level");
gui.add(params, 'point').name("Draw point");
gui.add(params, 'line').name("Draw line");
gui.add(params, 'polygon').name("Draw polygon");


const canvas = document.querySelector(".webgl") as HTMLElement;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({
  canvas: canvas!,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true

const scene = new THREE.Scene();
scene.background = new THREE.Color(0.4, 0.4, 0.4);

const sky = createSky();
scene.add(sky);
let providers = createProviders(params.elevationExaggeration);

// Helper
const geometryHelper = new THREE.ConeBufferGeometry(0.01 * 1e3, 0.05 * 1e3, 3);
const helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
scene.add(helper);

function createProviders(elevationExaggeration: number) {
  // const DEV_MAPBOX_API_KEY = document.getElementById("mapbox_api").value;
  const DEV_MAPBOX_API_KEY =
    "pk.eyJ1IjoicmFqYW4wMjciLCJhIjoiY2s2b25oYTg1MDJtazNsbXZ4OTFqcnN2cSJ9.MGaLTVPvgOjQazj7ZTX1nQ";
  // const DEV_HEREMAPS_APP_ID = document.getElementById("heremaps_id").value;
  // const DEV_HEREMAPS_APP_CODE = document.getElementById("heremaps_code").value;
  // const DEV_BING_API_KEY = document.getElementById("bing_api").value;
  // const DEV_MAPTILER_API_KEY = document.getElementById("maptiler_api").value;
  // const OPEN_MAP_TILES_SERVER_MAP = document.getElementById("openmap_tiles_server").value;

  return [
    // ["Vector OpenSteet Maps", new Geo.OpenStreetMapsProvider(),],
    // ["Vector OpenTile Maps", new Geo.OpenMapTilesProvider(OPEN_MAP_TILES_SERVER_MAP)],
    // ["Vector Map Box", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox/streets-v10", Geo.MapBoxProvider.STYLE)],
    // ["Vector Here Maps", new Geo.HereMapsProvider(DEV_HEREMAPS_APP_ID, DEV_HEREMAPS_APP_CODE, "base", "normal.day")],
    // ["Vector Here Maps Night", new Geo.HereMapsProvider(DEV_HEREMAPS_APP_ID, DEV_HEREMAPS_APP_CODE, "base", "normal.night")],
    // ["Vector Here Maps Terrain", new Geo.HereMapsProvider(DEV_HEREMAPS_APP_ID, DEV_HEREMAPS_APP_CODE, "aerial", "terrain.day")],
    // ["Vector Bing Maps", new Geo.BingMapsProvider(DEV_BING_API_KEY, Geo.BingMapsProvider.ROAD)],
    // ["Vector Map Tiler Basic", new Geo.MapTilerProvider(DEV_MAPTILER_API_KEY, "maps", "basic", "png")],
    // ["Vector Map Tiler Outdoor", new Geo.MapTilerProvider(DEV_MAPTILER_API_KEY, "maps", "outdoor", "png")],
    // ["Satellite Map Box", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox.satellite", Geo.MapBoxProvider.MAP_ID, "jpg70", false)],
    [
      "Satellite Map Box Labels",
      new Geo.MapBoxProvider(
        DEV_MAPBOX_API_KEY,
        "mapbox/satellite-streets-v10",
        Geo.MapBoxProvider.STYLE,
        "jpg70"
      ),
    ],
    // ["Satellite Here Maps", new Geo.HereMapsProvider(DEV_HEREMAPS_APP_ID, DEV_HEREMAPS_APP_CODE, "aerial", "satellite.day", "jpg")],
    // ["Satellite Bing Maps", new Geo.BingMapsProvider(DEV_BING_API_KEY, Geo.BingMapsProvider.AERIAL)],
    // ["Satellite Maps Tiler Labels", new Geo.MapTilerProvider(DEV_MAPTILER_API_KEY, "maps", "hybrid", "jpg")],
    // ["Satellite Maps Tiler", new Geo.MapTilerProvider(DEV_MAPTILER_API_KEY, "tiles", "satellite", "jpg")],
    [
      "Height Map Box",
      new Geo.MapBoxProvider(
        DEV_MAPBOX_API_KEY,
        "mapbox.terrain-rgb",
        Geo.MapBoxProvider.MAP_ID,
        "pngraw"
      ),
    ],
    // ["Height Map Tiler", new Geo.MapTilerProvider(DEV_MAPTILER_API_KEY, "tiles", "terrain-rgb", "png")],
    // ["Debug Height Map Box", new Geo.HeightDebugProvider(new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox.terrain-rgb", Geo.MapBoxProvider.MAP_ID, "pngraw"))],
    // ["Debug", new Geo.DebugProvider()],
    [
      "Height Map Bhumi",
      new Geo.BhumiMapsProvider(undefined, elevationExaggeration),
    ],
    ["Drone Map Bhumi", new Geo.BhumiMapsProvider("gurugram image tiles/")],
  ];
}

const modes = [
  ["Planar", Geo.MapView.PLANAR],
  ["Height", Geo.MapView.HEIGHT],
  // ["Martini", Geo.MapView.MARTINI],
  ["Height Shader", Geo.MapView.HEIGHT_SHADER],
  ["Spherical", Geo.MapView.SPHERICAL],
];

const mode: {
  selectedIndex?: number;
} = {};

const providerColor: {
  selectedIndex?: number;
} = {};

const providerHeight: {
  selectedIndex?: number;
} = {};

mode.selectedIndex = 1;
providerColor.selectedIndex = 3;
providerHeight.selectedIndex = 2;

let map = new Geo.MapView(
  modes[mode.selectedIndex][1] as number,
  providers[providerColor.selectedIndex][1] as Geo.MapProvider,
  providers[providerHeight.selectedIndex][1] as Geo.MapProvider
);
//================= scene add default mapview 
scene.add(map);
map.updateMatrixWorld(true);

const camera = new THREE.PerspectiveCamera(
  80,
  sizes.width / sizes.height,
  0.1,
  1e12
);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


const controls = new MapControls(camera, canvas!);
controls.minDistance = 1e1;
controls.zoomSpeed = 1.5;

const coords = Geo.UnitsUtils.datumsToSpherical(28.444519, 77.067277);
controls.target.set(coords.x, 0, -coords.y);
camera.position.set(coords.x, 2000, -coords.y);
controls.maxPolarAngle = Math.PI / 2 - 0.05
//==================scene add ambient light
scene.add(new THREE.AmbientLight(0x777777));

const directional = new THREE.DirectionalLight(0x888888);
directional.position.set(100, 10000, 700);
//==================scene add direction light
scene.add(directional);

// model loader 
let characterControls: any 
new GLTFLoader().load('models/Soldier.glb', function (gltf) {
  const model = gltf.scene;
  model.scale.set(20, 20, 20)
  model.position.set(8579083.523967698, 0, -3305289.6114165676)
  model.traverse(function (object: any) {
    if (object.isMesh) object.castShadow = true;
  });

  const mixer1 = new THREE.AnimationMixer(model);
  // mixer1.clipAction(gltf.animations[0]).play(); // walk
  //===================scene add gltf model 
  scene.add(model);

  const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
  const animationsMap: Map<string, THREE.AnimationAction> = new Map()
  const gltfA = gltfAnimations.filter(a => a.name != 'TPose')
  gltfA.forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer1.clipAction(a))
  })
  // mixers.push(mixer1);
  characterControls = new CharacterControls(model, mixer1, animationsMap, controls, camera,  'Idle');
});


// CONTROL KEYS
const keysPressed = {  }
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed as any)[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    (keysPressed as any)[event.key.toLowerCase()] = false
}, false);
const geometrys = [new THREE.BufferGeometry()];

let positionList = [];
let sizeList = [];
const pointCount = 3000;
for (let i = 0; i < pointCount; i++) {
  let x = Math.random() * (1000 - -50) + -50;
  let y = Math.random() * (1000 - -50) + -50;
  let z = Math.random() * (1000 - -50) + -50;
  let len = THREE.MathUtils.randFloat(10.25, 10.5);
  positionList.push(x, y, z, x, y, z);
  sizeList.push(0, len, 1, len);
}

geometrys[0].setAttribute(
  "position",
  new THREE.Float32BufferAttribute(positionList, 3)
);
geometrys[0].setAttribute(
  "sizeList",
  new THREE.Float32BufferAttribute(sizeList, 2)
);

var materials;
let globalUniforms = {
  time: { value: 0 },
  globalBloom: { value: 0 },
  noise: { value: null }
};
materials =
  new THREE.LineBasicMaterial({
    transparent: true,
    color: "#a5adb3",
    // GLSL

  }),

  (materials as any).onBeforeCompile = (shader: any) => {
    shader.uniforms.time = globalUniforms.time;
    shader.uniforms.noiseTex = globalUniforms.noise;
    shader.uniforms.globalBloom = globalUniforms.globalBloom;
    shader.vertexShader = `
uniform float time;
uniform sampler2D noiseTex;
attribute vec2 sizeList;
varying float vsizeList;
varying float vH;

${shader.vertexShader}
`.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>

vec3 pos = position;

vec2 nUv = (vec2(pos.x, -pos.z) - vec2(-25.)) / 50.;
float h = texture2D(noiseTex, nUv).g;
h = (h - 0.5) * 400.;

pos.y = -mod(10. - (pos.y - time * 5.), 15.) + 10.;
h = pos.y - h;
pos.y += sizeList.x * sizeList.y;
transformed = pos;
vsizeList = sizeList.x;
vH = smoothstep(3., 0., h);
`
    );
    shader.fragmentShader = `
uniform float time;
uniform float globalBloom;
varying float vsizeList;
varying float vH;
${shader.fragmentShader}
`.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
float op = 1. - vsizeList;
op = pow(op, 3.);
float h = (pow(vH, 3.) * 0.5 + 1.0); // or + 1.5
vec3 col = diffuse * h;
col *= 1. + smoothstep(0.99, 1., h);
vec4 diffuseColor = vec4( col, op );
`
    );
  }



const geometryyy = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 100, 0)]);
const materialll = new THREE.LineBasicMaterial({
  transparent: true,
  opacity: 0.5
});
let meshhh: any
meshhh = new THREE.Points(geometryyy, materials);

meshhh.position.set(8579083.523967698, 150, -3305289.6114165676)

scene.add(meshhh);

let rainPoints: any;
for (let i = 0, y = 0; i < 200; i++) {
  rainPoints = new THREE.LineSegments(geometrys[0], materials);
  rainPoints.position.set(8579083.523967698, y, -3305289.6114165676)
  scene.add(rainPoints);
  y += 25

}

let t = 0
function animate() {
  let delta = clock.getDelta();
  t += 0.00001


  requestAnimationFrame(animate);
  [].forEach.call(smokeParticles, (sp: any) => {
    if (sp.position.x > 8800000 && sp.position.x > 9079083) {
      sp.rotation.z += delta * 0.2;
    } else {
      sp.rotation.z -= delta * 0.1;
      sp.position.z += 100;
    }
  });
  let positionss = rainPoints.geometry.attributes.position.array;
  let xs = 0;
  for (let i = 0, l = positionss.length; i < l; i++) {
    positionss[xs] = positionss[xs];
    positionss[xs + 1] = positionss[xs + 1] - 0.95;
    positionss[xs + 2] = positionss[xs + 2];

    if (positionss[xs + 1] < -50) {
      positionss[xs + 1] = 50;
    }

    xs += 3;

  }

  rainPoints.geometry.attributes.position.needsUpdate = true;


  // [].forEach.call(mixers, (mi: any) => {

  //   let tangent3 = curve.getTangent(t)
  // //   mi._root.position.x = curve.getPoint(t).x
  //   mi._root.position.y = mi._root.position.y
  // //   mi._root.position.z = curve.getPoint(t).z
  //   mi._root.rotation.y = tangent3.y
  // })

  if (characterControls) {
    console.log(characterControls,"k")
    characterControls.update(clock.getDelta(), keysPressed);
  }
  controls.update();
  renderer.render(scene, camera);

  
  // for (const mixer of mixers) mixer.update( );

}

let action = () => {
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = '';
  loader.load(
    './2-cloud-png-image.png',
    function onLoad(texture) {
      const smokeGeo = new THREE.PlaneBufferGeometry(300, 300);

      let smokeMaterial = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true
      });


      // let fog = new THREE.Mesh(smokeGeo, smokeMaterial);
      // fog.position.set(8579083.523967698,100,-3305289.6114165676)
      // fog.scale.set(100,100,100)
      // fog.rotation.x = - Math.PI/2
      // scene.add(fog);
      // smokeParticles.push(fog)
      let x = 8579083.523967698; let y = 35000; let z = -3305289.6114165676;
      for (let p = 0, l = 350; p < l; p++) {
        let particle = new THREE.Mesh(smokeGeo, smokeMaterial);


        particle.position.set(
          x, y, z
        );
        particle.rotation.x = - Math.PI / 2
        // particle.scale.set(70, 70, 70)
        let scaleCloud = Math.floor(Math.random() * 500) + 1
        particle.scale.set(scaleCloud, scaleCloud, scaleCloud)
        // particle.rotation.set(5,5,5)
        //=======================scene add cloud
        scene.add(particle);

        smokeParticles.push(particle);

        //random operator

        var opindex = Math.floor(Math.random() * 2);
        switch (opindex) {
          case 0: {
            x = x + Math.floor(Math.random() * 200000) + 1;
            y += Math.floor(Math.random() * 700) + 1;
            z += Math.floor(Math.random() * 20000) + 1;
            break
          };
          case 1: {
            x -= Math.floor(Math.random() * 200000) + 1;
            y -= Math.floor(Math.random() * 700) + 1;
            z -= Math.floor(Math.random() * 2000) + 1;
            break
          };
        }
      }

      animate();
    }
  );

}

action();

function createSky() {
  // Add Sky
  const sky = new Sky();
  sky.scale.setScalar(1e8);

  // GUI
  const effectController = {
    turbidity: 0,
    rayleigh: 0.5,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    inclination: 0.48,
    azimuth: 0.25,
    exposure: 0.5,
  };

  const uniforms = sky.material.uniforms;
  uniforms["turbidity"].value = effectController.turbidity;
  uniforms["rayleigh"].value = effectController.rayleigh;
  uniforms["mieCoefficient"].value = effectController.mieCoefficient;
  uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;

  const theta = Math.PI * (effectController.inclination - 0.5);
  const phi = 2 * Math.PI * (effectController.azimuth - 0.5);

  const sun = new THREE.Vector3();
  sun.x = Math.cos(phi);
  sun.y = Math.sin(phi) * Math.sin(theta);
  sun.z = Math.sin(phi) * Math.cos(theta);
  uniforms["sunPosition"].value.copy(sun);

  return sky;
}

const rgbTerrainControl = gui.add(params, "showRGBTerrain");
const satelliteControl = gui.add(params, "showSatellite");
const BuildingsData = gui.add(params,"BuildingsData")
const elevExaggerationControl = gui.add(params, "elevationExaggeration");


rgbTerrainControl.name("Heliware RGB Terrain").onChange(() => {
  scene.remove(map);
  if (params.showRGBTerrain) {
    params.showSatellite = false;
    satelliteControl.updateDisplay();
    providerColor.selectedIndex = 2;
  } else {
    providerColor.selectedIndex = 0;
  }
  map = new Geo.MapView(
    modes[mode.selectedIndex!][1] as number,
    providers[providerColor.selectedIndex][1] as Geo.MapProvider,
    providers[providerHeight.selectedIndex!][1] as Geo.MapProvider
  );
  scene.add(map);
  map.updateMatrixWorld(true);
});

satelliteControl.name("Heliware Satellite Tile").onChange(() => {
  scene.remove(map);
  if (params.showSatellite) {
    params.showRGBTerrain = false;
    rgbTerrainControl.updateDisplay();
    providerColor.selectedIndex = 3;
  } else {
    providerColor.selectedIndex = 0;
  }
  map = new Geo.MapView(
    modes[mode.selectedIndex!][1] as number,
    providers[providerColor.selectedIndex!][1] as Geo.MapProvider,
    providers[providerHeight.selectedIndex!][1] as Geo.MapProvider
  );
  scene.add(map);
  map.updateMatrixWorld(true);
});

BuildingsData.name('Heliware Buildings Tile').onChange(()=>{
  var buildings = new OSMBuildings({
    container: 'canvasId',
    position: { latitude: 52.52128, longitude: 13.40894 },//392049.71 , 5820208.62
    zoom: 16,
    minZoom: 1,
    maxZoom: 20,
    tilt: 60,
    rotation: 300,
    effects: ['shadows'],
    
  });
  buildings.addGeoJSONTiles('https://{s}.data.osmbuildings.org/0.2/dixw8kmb/tile/{z}/{x}/{y}.json');



})



elevExaggerationControl
  .name("Elevation Exaggeration")
  .min(0.01)
  .max(2)
  .step(0.01)
  .onFinishChange(() => {
    scene.remove(map);
    providers = createProviders(params.elevationExaggeration);
    map = new Geo.MapView(
      modes[mode.selectedIndex!][1] as number,
      providers[providerColor.selectedIndex!][1] as Geo.MapProvider,
      providers[providerHeight.selectedIndex!][1] as Geo.MapProvider
    );
    scene.add(map);
    map.updateMatrixWorld(true);
  });




  