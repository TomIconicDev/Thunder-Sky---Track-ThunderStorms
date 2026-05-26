const countryConfig = {
  uk: { name: "United Kingdom", center: [-2.5, 54.5], zoom: 5.5, bounds: [-7.5, 50.0, 1.5, 58.5] },
  us: { name: "United States", center: [-96.0, 37.8], zoom: 3.5, bounds: [-124.0, 25.0, -67.0, 49.0] },
  de: { name: "Germany", center: [10.4515, 51.1657], zoom: 5.5, bounds: [5.9, 47.4, 15.0, 54.9] },
  au: { name: "Australia", center: [133.7751, -25.2744], zoom: 3.5, bounds: [113.0, -39.0, 153.0, -11.0] },
  br: { name: "Brazil", center: [-51.9253, -14.2350], zoom: 3.5, bounds: [-73.0, -33.0, -34.0, 4.0] }
};

let currentRegion = 'uk';
let userPosition = null;
let userGlMarker = null;
let selectedStrikeData = null;

let threeRadarLayer = null;
let radarMeshGroup = null;
let isRadarVisible = true;

// Initialize MapLibre GL JS engine with standard open-source night styling
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'dark-matter-tiles': {
        type: 'raster',
        tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
        tileSize: 256,
        attribution: '&copy; CARTO'
      }
    },
    layers: [
      {
        id: 'dark-matter',
        type: 'raster',
        source: 'dark-matter-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  },
  center: countryConfig[currentRegion].center,
  zoom: countryConfig[currentRegion].zoom,
  zoomControl: false,
  attributionControl: false
});

map.on('load', () => {
  // INITIALIZE THREE.JS WEBGL STORM CELL RADAR OVERLAY LAYER
  threeRadarLayer = {
    id: 'three-radar-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (mapInstance, gl) {
      this.camera = new THREE.PerspectiveCamera();
      this.scene = new THREE.Scene();

      radarMeshGroup = new THREE.Group();
      
      // Dynamic Volumetric Storm Cell Array Generator
      // Generates overlapping glowing clouds with soft, realistic night-time illumination shading
      const stormCellCount = 450;
      const particleGeo = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      
      const regionBounds = countryConfig[currentRegion].bounds;
      
      for (let i = 0; i < stormCellCount; i++) {
        // Distribute coordinates organically across active localized tracking matrices
        const lon = regionBounds[0] + Math.random() * (regionBounds[2] - regionBounds[0]);
        const lat = regionBounds[1] + Math.random() * (regionBounds[3] - regionBounds[1]);
        
        // Project spatial coordinate transformations directly into MapLibre Mercator vector matrix positions
        const coord = maplibregl.MercatorCoordinate.fromLngLat([lon, lat], 4000 + Math.random() * 2500);
        positions.push(coord.x, coord.y, coord.z);

        // Dark Atmospheric Shading: Deep storm indigo bleeding into soft city-glowing neon cyan
        const mixingRatio = Math.random();
        const r = THREE.MathUtils.lerp(0.02, 0.00, mixingRatio);
        const g = THREE.MathUtils.lerp(0.35, 0.65, mixingRatio);
        const b = THREE.MathUtils.lerp(0.60, 0.95, mixingRatio);
        colors.push(r, g, b);
      }

      particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      particleGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Generate a dynamic, procedural high-fidelity canvas glow particle map texture
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      gradient.addColorStop(0.3, 'rgba(0, 180, 255, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 30, 80, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);

      const particleMat = new THREE.PointsMaterial({
        size: 0.015, // Smooth scaling sizes calculated natively via vector matrix dimensions
        vertexColors: true,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: texture
      });

      const stormPoints = new THREE.Points(particleGeo, particleMat);
      radarMeshGroup.add(stormPoints);
      this.scene.add(radarMeshGroup);

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialiasing: true
      });
      this.renderer.autoClear = false;
    },
    render: function (gl, matrix) {
      // Dynamic camera position syncing calculation routines mapping real-world coordinates onto WebGL scene frames
      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(0, 0, 0)
        .scale(new THREE.Vector3(1, 1, 1));

      this.camera.projectionMatrix = m.multiply(l);
      
      // Animate the cloud deck dynamics cleanly in memory loop stacks
      if (radarMeshGroup && isRadarVisible) {
        radarMeshGroup.rotation.z += 0.00015;
      }

      this.renderer.resetState();
      if (isRadarVisible) {
        this.renderer.render(this.scene, this.camera);
      }
      map.triggerRepaint();
    }
  };

  map.addLayer(threeRadarLayer);
  map.on('click', closeInspectionSheet);
});

function regenerateThreeRadarCells() {
  if (!threeRadarLayer || !radarMeshGroup) return;
  
  // Wipe and rebuild the particle structures when moving tracking view points across countries
  const scene = threeRadarLayer.scene;
  scene.remove(radarMeshGroup);
  
  radarMeshGroup = new THREE.Group();
  const stormCellCount = 450;
  const particleGeo = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  
  const regionBounds = countryConfig[currentRegion].bounds;
  
  for (let i = 0; i < stormCellCount; i++) {
    const lon = regionBounds[0] + Math.random() * (regionBounds[2] - regionBounds[0]);
    const lat = regionBounds[1] + Math.random() * (regionBounds[3] - regionBounds[1]);
    
    const coord = maplibregl.MercatorCoordinate.fromLngLat([lon, lat], 4000 + Math.random() * 2500);
    positions.push(coord.x, coord.y, coord.z);

    const mixingRatio = Math.random();
    const r = THREE.MathUtils.lerp(0.02, 0.00, mixingRatio);
    const g = THREE.MathUtils.lerp(0.35, 0.65, mixingRatio);
    const b = THREE.MathUtils.lerp(0.60, 0.95, mixingRatio);
    colors.push(r, g, b);
  }

  particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.3, 'rgba(0, 180, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 30, 80, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const particleMat = new THREE.PointsMaterial({
    size: 0.015,
    vertexColors: true,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: texture
  });

  const stormPoints = new THREE.Points(particleGeo, particleMat);
  radarMeshGroup.add(stormPoints);
  scene.add(radarMeshGroup);
  map.triggerRepaint();
}

function createLightningStrike(lat, lon, distance, magnitude) {
  let hexColor = '#ffd60a';
  let intensityClass = 'highlight-yellow';
  
  if (magnitude >= 5.0 && magnitude < 8.0) {
    hexColor = '#ff9f0a';
    intensityClass = 'highlight-orange';
  } else if (magnitude >= 8.0) {
    hexColor = '#ff453a';
    intensityClass = 'highlight-red';
  }

  const milesHeard = parseFloat((magnitude * 1.9).toFixed(1));
  const acousticalDelay = Math.round(distance * 2.91);

  const sourceId = `strike-src-${Math.random().toString(36).substr(2, 9)}`;
  const fillLayerId = `strike-fill-${sourceId}`;
  const lineLayerId = `strike-line-${sourceId}`;

  function getCirclePolygonGeoJSON(centerLng, centerLat, radiusKm) {
    const kmPoints = 64;
    const coordinates = [];
    for (let i = 0; i < kmPoints; i++) {
      const angle = (i * 360) / kmPoints;
      const radians = (angle * Math.PI) / 180;
      const degreesLon = centerLng + (radiusKm / 111.32) * Math.cos(radians) / Math.cos(centerLat * Math.PI / 180);
      const degreesLat = centerLat + (radiusKm / 110.57) * Math.sin(radians);
      coordinates.push([degreesLon, degreesLat]);
    }
    coordinates.push(coordinates[0]);
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coordinates] }
    };
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data: getCirclePolygonGeoJSON(lon, lat, 0.01)
  });

  map.addLayer({
    id: fillLayerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': hexColor,
      'fill-opacity': 0.25
    }
  });

  map.addLayer({
    id: lineLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': hexColor,
      'line-width': 2.5,
      'line-opacity': 0.85
    }
  });

  let currentStep = 0;
  const maxSteps = 90;
  const maxRadiusKm = milesHeard * 1.60934;

  const strikeTelemetry = { 
    lat, lon, distance, magnitude, milesHeard, acousticalDelay, 
    intensityClass, sourceId, fillLayerId, lineLayerId 
  };

  const expansionLoop = setInterval(() => {
    if (selectedStrikeData && selectedStrikeData.sourceId === sourceId) return;

    currentStep++;
    if (currentStep >= maxSteps) {
      clearInterval(expansionLoop);
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(getCirclePolygonGeoJSON(lon, lat, maxRadiusKm));
        map.setPaintProperty(fillLayerId, 'fill-opacity', 0.05);
        map.setPaintProperty(lineLayerId, 'line-opacity', 0.35);
      }
    } else {
      const progress = currentStep / maxSteps;
      const immediateRadius = maxRadiusKm * progress;
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(getCirclePolygonGeoJSON(lon, lat, immediateRadius));
        map.setPaintProperty(fillLayerId, 'fill-opacity', 0.25 * (1 - progress));
        map.setPaintProperty(lineLayerId, 'line-opacity', 0.85 * (1 - progress));
      }
    }
  }, 22);

  map.on('click', fillLayerId, (e) => {
    e.preventDefault();
    openInspectionSheet(strikeTelemetry);
  });

  map.on('mouseenter', fillLayerId, () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', fillLayerId, () => map.getCanvas().style.cursor = '');

  if (distance < 15) {
    const audio = document.getElementById("thunderAudio");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  setTimeout(() => {
    if (selectedStrikeData && selectedStrikeData.sourceId === sourceId) {
      strikeTelemetry.isOrphanedPending = true;
    } else {
      cleanupStrikeLayers(lineLayerId, fillLayerId, sourceId);
    }
  }, 180000);
}

function cleanupStrikeLayers(lineLayerId, fillLayerId, sourceId) {
  if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
  if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

function openInspectionSheet(telemetry) {
  selectedStrikeData = telemetry;

  const severityEl = document.getElementById("inspect-severity");
  severityEl.innerText = `M ${telemetry.magnitude.toFixed(1)}`;
  severityEl.className = "met-value " + telemetry.intensityClass;

  document.getElementById("inspect-region").innerText = `${countryConfig[currentRegion].name} Event`;
  document.getElementById("inspect-distance").innerText = `${telemetry.distance} km`;
  document.getElementById("inspect-delay").innerText = `${telemetry.acousticalDelay} sec`;
  document.getElementById("inspect-range").innerText = `${telemetry.milesHeard} miles`;
  document.getElementById("inspect-coords").innerText = `${telemetry.lat.toFixed(4)}, ${telemetry.lon.toFixed(4)}`;

  document.getElementById("radar-toggle-container").style.transform = "translateY(150%)";
  document.getElementById("radar-toggle-container").style.opacity = "0";
  document.getElementById("detail-sheet").classList.add("visible");
}

function closeInspectionSheet() {
  if (!selectedStrikeData) return;

  const closedData = selectedStrikeData;
  selectedStrikeData = null;

  document.getElementById("detail-sheet").classList.remove("visible");
  document.getElementById("radar-toggle-container").style.transform = "translateY(0)";
  document.getElementById("radar-toggle-container").style.opacity = "1";

  if (closedData.isOrphanedPending) {
    cleanupStrikeLayers(closedData.lineLayerId, closedData.fillLayerId, closedData.sourceId);
  }
}

document.getElementById('share-strike-btn').addEventListener('click', async () => {
  if (!selectedStrikeData) return;
  
  const shareText = `Thunder Sky Alert: Severe Storm Event detected in ${countryConfig[currentRegion].name}! Severity Rating: M ${selectedStrikeData.magnitude.toFixed(1)}, Audible Range: ${selectedStrikeData.milesHeard} miles. Coordinates: ${selectedStrikeData.lat.toFixed(4)}, ${selectedStrikeData.lon.toFixed(4)}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Storm Tracking Telemetry', text: shareText, url: window.location.href });
    } catch (err) {}
  } else {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Telemetry payload copied securely to clipboard!");
    } catch (err) {}
  }
});

function randomLightning() {
  const config = countryConfig[currentRegion];
  const bounds = config.bounds;

  const lon = bounds[0] + (Math.random() * (bounds[2] - bounds[0]));
  const lat = bounds[1] + (Math.random() * (bounds[3] - bounds[1]));
  const distance = Math.floor(Math.random() * 38) + 1;
  const magnitude = parseFloat((Math.random() * 9.0 + 1.0).toFixed(1));

  createLightningStrike(lat, lon, distance, magnitude);
}

let strikeTimer = setInterval(randomLightning, 3800);

if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    userPosition = [lon, lat];

    const el = document.createElement('div');
    el.className = 'custom-gl-user-node';

    if (!userGlMarker) {
      userGlMarker = new maplibregl.Marker({ element: el })
        .setLngLat(userPosition)
        .addTo(map);
    } else {
      userGlMarker.setLngLat(userPosition);
    }
  }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
}

document.getElementById('close-sheet').addEventListener('click', closeInspectionSheet);

document.getElementById('country-selector').addEventListener('change', (e) => {
  currentRegion = e.target.value;
  const config = countryConfig[currentRegion];
  closeInspectionSheet();
  regenerateThreeRadarCells();
  map.flyTo({ center: config.center, zoom: config.zoom, speed: 1.2, essential: true });
});

document.getElementById('recenter-btn').addEventListener('click', () => {
  if (userPosition) {
    map.flyTo({ center: userPosition, zoom: 12, speed: 1.2, essential: true });
  } else {
    const config = countryConfig[currentRegion];
    map.flyTo({ center: config.center, zoom: config.zoom, speed: 1.2, essential: true });
  }
});

// Floating Radar HUD Visibility Toggler Button
document.getElementById('radar-toggle').addEventListener('click', () => {
  const radarBtn = document.getElementById('radar-toggle');
  const txt = document.getElementById('radar-status-text');
  
  if (isRadarVisible) {
    isRadarVisible = false;
    radarBtn.classList.remove('active');
    txt.innerText = "Radar Muted";
  } else {
    isRadarVisible = true;
    radarBtn.classList.add('active');
    txt.innerText = "3D Radar Active";
  }
  map.triggerRepaint();
});