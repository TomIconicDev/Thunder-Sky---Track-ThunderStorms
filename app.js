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

// Initialize MapLibre GL JS engine using completely open and free tile server architectures
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
        maxzoom: 20 // Handles high zoom thresholds seamlessly by re-sampling tiles natively
      }
    ]
  },
  center: countryConfig[currentRegion].center,
  zoom: countryConfig[currentRegion].zoom,
  zoomControl: false,
  attributionControl: false
});

map.on('load', () => {
  // Inject streaming weather precipitation reflection radar sources directly into WebGL memory stack
  map.addSource('rainviewer-radar', {
    type: 'raster',
    tiles: ['https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png'],
    tileSize: 256
  });

  map.addLayer({
    id: 'radar-layer',
    type: 'raster',
    source: 'rainviewer-radar',
    paint: { 'raster-opacity': 0.42 }
  });

  // Track global dismiss triggers on the map canvas
  map.on('click', closeInspectionSheet);
});

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

  // Generate unique feature ID signatures to manage the geometric shapes independently
  const sourceId = `strike-src-${Math.random().toString(36).substr(2, 9)}`;
  const layerId = `strike-lyr-${sourceId}`;

  // Helper utility to translate real-world radius expansion steps into geographic GeoJSON coordinate arrays
  function getCirclePolygonGeoJSON(centerLng, centerLat, radiusKm) {
    const kmPoints = 64;
    const coordinates = [];
    for (let i = 0; i < kmPoints; i++) {
      const angle = (i * 360) / kmPoints;
      const radians = (angle * Math.PI) / 180;
      // Degrees conversions mapping equations
      const degreesLon = centerLng + (radiusKm / 111.32) * Math.cos(radians) / Math.cos(centerLat * Math.PI / 180);
      const degreesLat = centerLat + (radiusKm / 110.57) * Math.sin(radians);
      coordinates.push([degreesLon, degreesLat]);
    }
    coordinates.push(coordinates[0]); // Complete structural geometric polygon ring loop closure
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coordinates] }
    };
  }

  // Inject empty starting node source properties directly inside MapLibre runtime layout
  map.addSource(sourceId, {
    type: 'geojson',
    data: getCirclePolygonGeoJSON(lon, lat, 0.01)
  });

  map.addLayer({
    id: layerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': hexColor,
      'fill-opacity': 0.15,
      'fill-outline-color': hexColor
    }
  });

  let currentStep = 0;
  const maxSteps = 90;
  const maxRadiusKm = milesHeard * 1.60934;

  const strikeTelemetry = { 
    lat, lon, distance, magnitude, milesHeard, acousticalDelay, 
    intensityClass, sourceId, layerId 
  };

  const expansionLoop = setInterval(() => {
    if (selectedStrikeData && selectedStrikeData.sourceId === sourceId) return;

    currentStep++;
    if (currentStep >= maxSteps) {
      clearInterval(expansionLoop);
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(getCirclePolygonGeoJSON(lon, lat, maxRadiusKm));
        map.setPaintProperty(layerId, 'fill-opacity', 0.02);
      }
    } else {
      const progress = currentStep / maxSteps;
      const immediateRadius = maxRadiusKm * progress;
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(getCirclePolygonGeoJSON(lon, lat, immediateRadius));
        map.setPaintProperty(layerId, 'fill-opacity', 0.15 * (1 - progress));
      }
    }
  }, 22);

  // MapLibre cursor inspection tap click interception triggers
  map.on('click', layerId, (e) => {
    e.preventDefault();
    openInspectionSheet(strikeTelemetry);
  });

  // Mouse hover event changes map canvas cursor styles cleanly
  map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');

  if (distance < 15) {
    const audio = document.getElementById("thunderAudio");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  // Lifespan Garbage Sweep: Wipe vector allocations out of WebGL frame memory after exactly 3 minutes
  setTimeout(() => {
    if (selectedStrikeData && selectedStrikeData.sourceId === sourceId) {
      strikeTelemetry.isOrphanedPending = true;
    } else {
      cleanupStrikeLayers(layerId, sourceId);
    }
  }, 180000);
}

function cleanupStrikeLayers(layerId, sourceId) {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
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

  // UI Transformation pushes bottom HUD element away while sliding sheet up
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
    cleanupStrikeLayers(closedData.layerId, closedData.sourceId);
  }
}

// Native HTML5 Mobile Share action payload injection setup
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
      alert("Telemetry payload copied securely to structural clipboard!");
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

// Hardware Geolocation Native Pipeline Loop
if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    userPosition = [lon, lat]; // MapLibre takes coordinates formatted as [Lng, Lat]

    const el = document.createElement('div');
    el.className = 'custom-gl-user-node';

    if (!userGlMarker) {
      userGlMarker = new maplibregl.Marker({ element: el })
        .setLatLng(userPosition)
        .addTo(map);
    } else {
      userGlMarker.setLatLng(userPosition);
    }
  }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
}

document.getElementById('close-sheet').addEventListener('click', closeInspectionSheet);

document.getElementById('country-selector').addEventListener('change', (e) => {
  currentRegion = e.target.value;
  const config = countryConfig[currentRegion];
  closeInspectionSheet();
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
  
  if (map.getLayer('radar-layer')) {
    map.removeLayer('radar-layer');
    radarBtn.classList.remove('active');
    txt.innerText = "Radar Muted";
  } else {
    map.addLayer({
      id: 'radar-layer',
      type: 'raster',
      source: 'rainviewer-radar',
      paint: { 'raster-opacity': 0.42 }
    });
    radarBtn.classList.add('active');
    txt.innerText = "Radar Active";
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}