const countryConfig = {
  uk: { name: "United Kingdom", center: [54.5, -2.5], zoom: 6, bounds: [50.0, -7.5, 58.5, 1.5] },
  us: { name: "United States", center: [37.8, -96.0], zoom: 4, bounds: [25.0, -124.0, 49.0, -67.0] },
  de: { name: "Germany", center: [51.1657, 10.4515], zoom: 6, bounds: [47.4, 5.9, 54.9, 15.0] },
  au: { name: "Australia", center: [-25.2744, 133.7751], zoom: 4, bounds: [-39.0, 113.0, -11.0, 153.0] },
  br: { name: "Brazil", center: [-14.2350, -51.9253], zoom: 4, bounds: [-33.0, -73.0, 4.0, -34.0] }
};

let currentRegion = 'uk';
let userPosition = null;
let userLocMarker = null;
let selectedCircleData = null;

// Hard restriction tracking limit parameters applied to prevent missing map tile crashes
const map = L.map('map', {
  zoomControl: false,
  maxZoom: 16, 
  minZoom: 3,
  inertia: true
}).setView(countryConfig[currentRegion].center, countryConfig[currentRegion].zoom);

// Real city lights night map configuration style setup
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CARTO',
  subdomains: 'abcd',
  maxZoom: 16
}).addTo(map);

const radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png', {
  opacity: 0.42,
  maxZoom: 16
}).addTo(map);

function createLightningStrike(lat, lon, distance, magnitude) {
  // Determine color classifications programmatically based on seismographic magnitude severity scores
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
  const expansionRadiusMeters = milesHeard * 1609.34; 
  const acousticalDelay = Math.round(distance * 2.91);

  // Pure circle soundwave representation - Completely clean design with no overlapping icon layer needed
  const geoCircle = L.circle([lat, lon], {
    radius: 0,
    color: hexColor,
    weight: magnitude >= 8.0 ? 3.0 : 1.8,
    fillColor: hexColor,
    fillOpacity: 0.14,
    interactive: true
  }).addTo(map);

  let currentStep = 0;
  const maxSteps = 90;
  
  const strikeTelemetry = { 
    lat, lon, distance, magnitude, milesHeard, acousticalDelay, 
    intensityClass, hexColor, geoCircle 
  };

  const expansionLoop = setInterval(() => {
    // Structural pause verification pattern executed when selection context locks focus
    if (selectedCircleData && selectedCircleData.geoCircle === geoCircle) return;

    currentStep++;
    if (currentStep >= maxSteps) {
      clearInterval(expansionLoop);
      geoCircle.setRadius(expansionRadiusMeters);
      geoCircle.setStyle({ opacity: 0.2, fillOpacity: 0.02 });
    } else {
      const progress = currentStep / maxSteps;
      geoCircle.setRadius(expansionRadiusMeters * progress);
      geoCircle.setStyle({
        opacity: 1 - progress,
        fillOpacity: 0.14 * (1 - progress)
      });
    }
  }, 22);

  // Hook operational tracking selection interaction to wave lines directly
  geoCircle.on('click', (e) => {
    L.DomEvent.stopPropagation(e);
    openInspectionSheet(strikeTelemetry);
  });

  // Automatically sweep the geographic map tracking layers from engine hardware loop memory after 3 minutes
  setTimeout(() => {
    if (selectedCircleData && selectedCircleData.geoCircle === geoCircle) {
      strikeTelemetry.isOrphanedPending = true;
    } else {
      if (map.hasLayer(geoCircle)) map.removeLayer(geoCircle);
    }
  }, 180000);
}

function openInspectionSheet(telemetry) {
  selectedCircleData = telemetry;

  const severityEl = document.getElementById("inspect-severity");
  severityEl.innerText = `M ${telemetry.magnitude.toFixed(1)}`;
  
  // Clear any existing custom color styling properties
  severityEl.className = "met-value";
  severityEl.classList.add(telemetry.intensityClass);

  document.getElementById("inspect-region").innerText = `${countryConfig[currentRegion].name} Event`;
  document.getElementById("inspect-distance").innerText = `${telemetry.distance} km`;
  document.getElementById("inspect-delay").innerText = `${telemetry.acousticalDelay} sec`;
  document.getElementById("inspect-range").innerText = `${telemetry.milesHeard} miles`;
  document.getElementById("inspect-coords").innerText = `${telemetry.lat.toFixed(4)}, ${telemetry.lon.toFixed(4)}`;

  // Animate interface elements gracefully
  document.getElementById("radar-control-dock").style.transform = "translate(-50%, 150%)";
  document.getElementById("radar-control-dock").style.opacity = "0";
  document.getElementById("detail-sheet").classList.add("visible");
}

function closeInspectionSheet() {
  if (!selectedCircleData) return;

  const deadData = selectedCircleData;
  selectedCircleData = null;

  document.getElementById("detail-sheet").classList.remove("visible");
  document.getElementById("radar-control-dock").style.transform = "translate(-50%, 0)";
  document.getElementById("radar-control-dock").style.opacity = "1";

  // If node schedule expired during display evaluation window, scrub layer safely
  if (deadData.isOrphanedPending) {
    if (map.hasLayer(deadData.geoCircle)) map.removeLayer(deadData.geoCircle);
  }
}

// Share Handler utilizing modern native secure Web Share standard APIs
document.getElementById('share-strike-btn').addEventListener('click', async () => {
  if (!selectedCircleData) return;
  
  const shareText = `Thunder Sky Alert: Severe Storm Event detected in ${countryConfig[currentRegion].name}! Magnitude: M ${selectedCircleData.magnitude.toFixed(1)}, Audible Range: ${selectedCircleData.milesHeard} miles. Coords: ${selectedCircleData.lat.toFixed(4)}, ${selectedCircleData.lon.toFixed(4)}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Tactical Storm Telemetry',
        text: shareText,
        url: window.location.href
      });
    } catch (err) {}
  } else {
    // Secure Fallback routine strategy for desktop running nodes
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Telemetry payload copied securely to structural clipboard!");
    } catch (err) {}
  }
});

function randomLightning() {
  const config = countryConfig[currentRegion];
  const bounds = config.bounds;

  const lat = bounds[0] + (Math.random() * (bounds[2] - bounds[0]));
  const lon = bounds[1] + (Math.random() * (bounds[3] - bounds[1]));
  const distance = Math.floor(Math.random() * 38) + 1;
  const magnitude = parseFloat((Math.random() * 9.0 + 1.0).toFixed(1));

  createLightningStrike(lat, lon, distance, magnitude);
}

let strikeTimer = setInterval(randomLightning, 3800);

// Hardware Geolocation Sync System Watch Pipeline
if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    userPosition = [lat, lon];

    if (!userLocMarker) {
      const userIcon = L.divIcon({
        className: 'user-marker-wrapper',
        html: '<div class="user-gps-core"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      userLocMarker = L.marker(userPosition, { icon: userIcon }).addTo(map);
    } else {
      userLocMarker.setLatLng(userPosition);
    }
  }, () => {}, {
    enableHighAccuracy: true,
    timeout: 10000
  });
}

// Interface Global Triggers
map.on('click', closeInspectionSheet);
document.getElementById('close-sheet').addEventListener('click', closeInspectionSheet);

document.getElementById('country-selector').addEventListener('change', (e) => {
  currentRegion = e.target.value;
  const config = countryConfig[currentRegion];
  closeInspectionSheet();
  map.flyTo(config.center, config.zoom, { animate: true, duration: 1.4 });
});

document.getElementById('recenter-btn').addEventListener('click', () => {
  if (userPosition) {
    map.flyTo(userPosition, 12, { animate: true, duration: 1.2 });
  } else {
    const config = countryConfig[currentRegion];
    map.flyTo(config.center, config.zoom, { animate: true, duration: 1.2 });
  }
});

// Weather Radar Controller
const radarBtn = document.getElementById('radar-toggle');
radarBtn.addEventListener('click', () => {
  const statusLabel = document.getElementById('hud-radar-status');
  const radarIcon = document.getElementById('radar-icon');
  
  if (map.hasLayer(radarLayer)) {
    map.removeLayer(radarLayer);
    radarBtn.classList.remove('active');
    statusLabel.innerText = "Radar Muted";
    radarIcon.className = "fa-solid fa-pause";
  } else {
    radarLayer.addTo(map);
    radarBtn.classList.add('active');
    statusLabel.innerText = "Radar Active";
    radarIcon.className = "fa-solid fa-play";
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}