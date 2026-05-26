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
let radarActive = true;

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
        maxzoom: 20
      }
    ]
  },
  center: countryConfig[currentRegion].center,
  zoom: countryConfig[currentRegion].zoom,
  zoomControl: false,
  attributionControl: false
});

map.on('load', () => {
  map.addSource('rainviewer-radar', {
    type: 'raster',
    tiles: ['https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png'],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 6 
  });

  map.addLayer({
    id: 'radar-layer',
    type: 'raster',
    source: 'rainviewer-radar',
    paint: { 
      'raster-opacity': 0.45,
      'raster-resampling': 'linear'
    }
  });

  map.on('zoom', handleZoomThresholds);
  map.on('click', closeInspectionSheet);
});

function handleZoomThresholds() {
  const currentZoom = map.getZoom();
  const txt = document.getElementById('radar-status-text');
  const dot = document.querySelector('.radar-pulse-dot');
  
  if (!radarActive) return;

  if (currentZoom > 7) {
    txt.innerText = "Radar Maxed";
    if (dot) dot.style.backgroundColor = "#ff9f0a";
  } else {
    txt.innerText = "Radar Active";
    if (dot) dot.style.backgroundColor = "#ffd60a";
  }
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

  // 1. DYNAMIC INNER FILL GLOW
  map.addLayer({
    id: fillLayerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': hexColor,
      'fill-opacity': 0.25 // Higher baseline visibility
    }
  });

  // 2. SHARP OUTER BOUNDARY LINE (FIXES THE DIMNESS)
  map.addLayer({
    id: lineLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': hexColor,
      'line-width': 2.5, // Crisp, highly visible border
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

  // Click inspection handles line or fill intersections gracefully
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

document.getElementById('radar-toggle').addEventListener('click', () => {
  const radarBtn = document.getElementById('radar-toggle');
  const txt = document.getElementById('radar-status-text');
  const dot = document.querySelector('.radar-pulse-dot');
  
  if (map.getLayer('radar-layer')) {
    map.removeLayer('radar-layer');
    radarBtn.classList.remove('active');
    txt.innerText = "Radar Off";
    radarActive = false;
    if (dot) dot.style.backgroundColor = "#aeaeae";
  } else {
    map.addLayer({
      id: 'radar-layer',
      type: 'raster',
      source: 'rainviewer-radar',
      paint: { 'raster-opacity': 0.42 }
    });
    radarBtn.classList.add('active');
    radarActive = true;
    handleZoomThresholds();
  }
});