const countryConfig = {
  uk: { center: [54.5, -2.5], zoom: 6, bounds: [50.0, -7.5, 58.5, 1.5] },
  us: { center: [37.8, -96.0], zoom: 4, bounds: [25.0, -124.0, 49.0, -67.0] },
  de: { center: [51.1657, 10.4515], zoom: 6, bounds: [47.4, 5.9, 54.9, 15.0] },
  au: { center: [-25.2744, 133.7751], zoom: 4, bounds: [-39.0, 113.0, -11.0, 153.0] },
  br: { center: [-14.2350, -51.9253], zoom: 4, bounds: [-33.0, -73.0, 4.0, -34.0] }
};

let currentRegion = 'uk';
let userPosition = null;
let userLocMarker = null;
let selectedStrikeData = null;

const map = L.map('map', {
  zoomControl: false,
  maxZoom: 16, 
  minZoom: 3,
  inertia: true
}).setView(countryConfig[currentRegion].center, countryConfig[currentRegion].zoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CARTO',
  subdomains: 'abcd',
  maxZoom: 16
}).addTo(map);

const radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png', {
  opacity: 0.35,
  maxZoom: 16
}).addTo(map);

function createLightningStrike(lat, lon, distance, magnitude) {
  const isUltra = magnitude >= 8.0;
  
  // High-fidelity vector clean minimal dot micro-marker design
  const cleanDotIcon = L.divIcon({
    html: `<div class="clean-strike-dot ${isUltra ? 'ultra-power' : ''}"></div>`,
    className: 'lightning-marker-node',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const milesHeard = parseFloat((magnitude * 1.8).toFixed(1));
  const expansionRadiusMeters = milesHeard * 1609.34; 
  const acousticalDelay = Math.round(distance * 2.91);

  const marker = L.marker([lat, lon], { icon: cleanDotIcon }).addTo(map);

  const geoCircle = L.circle([lat, lon], {
    radius: 0,
    color: isUltra ? '#ff453a' : '#007aff',
    weight: isUltra ? 2.0 : 1.2,
    fillColor: isUltra ? '#ff453a' : '#007aff',
    fillOpacity: 0.12,
    interactive: true // Interactive enabled to support click interceptions directly on propagation lines
  }).addTo(map);

  let currentStep = 0;
  const maxSteps = 85;
  
  // Track structural data bindings directly on map entities
  const strikeTelemetry = { lat, lon, distance, magnitude, milesHeard, acousticalDelay, marker, geoCircle };

  const expansionLoop = setInterval(() => {
    // If the user has selected this exact strike context, pause loop processing execution safely
    if (selectedStrikeData && selectedStrikeData.marker === marker) return;

    currentStep++;
    if (currentStep >= maxSteps) {
      clearInterval(expansionLoop);
      geoCircle.setRadius(expansionRadiusMeters);
      geoCircle.setStyle({ opacity: 0.15, fillOpacity: 0.01 });
    } else {
      const progress = currentStep / maxSteps;
      geoCircle.setRadius(expansionRadiusMeters * progress);
      geoCircle.setStyle({
        opacity: 1 - progress,
        fillOpacity: 0.12 * (1 - progress)
      });
    }
  }, 24);

  // Bind interactive click routing listeners
  const inspectHandler = (e) => {
    L.DomEvent.stopPropagation(e); // Stop event bubbling to underlying map
    openInspectionSheet(strikeTelemetry);
  };

  marker.on('click', inspectHandler);
  geoCircle.on('click', inspectHandler);

  // Update dynamic HUD panel
  if (!selectedStrikeData) {
    document.getElementById("distance").innerHTML = `${distance} <span class="unit">km</span>`;
    document.getElementById("severity").innerHTML = `M ${magnitude.toFixed(1)}`;
    document.getElementById("delay").innerText = `${acousticalDelay} sec`;
    document.getElementById("miles-heard").innerText = `${milesHeard} mi`;
  }

  if (distance < 15) {
    const audio = document.getElementById("thunderAudio");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  // 3-minute lifecycle clean sweeping rule
  setTimeout(() => {
    // If user is actively tracking, defer destruction stack processing
    if (selectedStrikeData && selectedStrikeData.marker === marker) {
      strikeTelemetry.expiredPending = true;
    } else {
      if (map.hasLayer(marker)) map.removeLayer(marker);
      if (map.hasLayer(geoCircle)) map.removeLayer(geoCircle);
    }
  }, 180000);
}

function openInspectionSheet(telemetry) {
  selectedStrikeData = telemetry;

  const severityEl = document.getElementById("inspect-severity");
  severityEl.innerText = `M ${telemetry.magnitude.toFixed(1)}`;
  if (telemetry.magnitude >= 8.0) {
    severityEl.classList.add("critical");
  } else {
    severityEl.classList.remove("critical");
  }

  document.getElementById("inspect-distance").innerText = `${telemetry.distance} km`;
  document.getElementById("inspect-delay").innerText = `${telemetry.acousticalDelay} sec`;
  document.getElementById("inspect-range").innerText = `${telemetry.milesHeard} miles`;
  document.getElementById("inspect-coords").innerText = `${telemetry.lat.toFixed(4)}, ${telemetry.lon.toFixed(4)}`;

  // Slide visual layer elements
  document.getElementById("main-panel").style.transform = "translate(-50%, 120%)";
  document.getElementById("main-panel").style.opacity = "0";
  document.getElementById("detail-sheet").classList.add("visible");
}

function closeInspectionSheet() {
  if (!selectedStrikeData) return;

  const closedData = selectedStrikeData;
  selectedStrikeData = null;

  document.getElementById("detail-sheet").classList.remove("visible");
  document.getElementById("main-panel").style.transform = "translate(-50%, 0)";
  document.getElementById("main-panel").style.opacity = "1";

  // Safe lazy garbage cleanup execution if object time limit expired during user active session inspection
  if (closedData.expiredPending) {
    if (map.hasLayer(closedData.marker)) map.removeLayer(closedData.marker);
    if (map.hasLayer(closedData.geoCircle)) map.removeLayer(closedData.geoCircle);
  }
}

function randomLightning() {
  const config = countryConfig[currentRegion];
  const bounds = config.bounds;

  const lat = bounds[0] + (Math.random() * (bounds[2] - bounds[0]));
  const lon = bounds[1] + (Math.random() * (bounds[3] - bounds[1]));
  const distance = Math.floor(Math.random() * 35) + 1;
  const magnitude = parseFloat((Math.random() * 9.0 + 1.0).toFixed(1));

  createLightningStrike(lat, lon, distance, magnitude);
}

let strikeTimer = setInterval(randomLightning, 4000);

// Hardware Position Watch Pipeline (Continuously tracking user location correctly)
if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    userPosition = [lat, lon];
    
    document.getElementById("status").innerText = "GPS Synchronized";

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
  }, (err) => {
    document.getElementById("status").innerText = "Region Base Active";
  }, {
    enableHighAccuracy: true,
    timeout: 10000
  });
}

// Global dismiss triggers
map.on('click', closeInspectionSheet);
document.getElementById('close-sheet').addEventListener('click', closeInspectionSheet);

document.getElementById('country-selector').addEventListener('change', (e) => {
  currentRegion = e.target.value;
  const config = countryConfig[currentRegion];
  closeInspectionSheet();
  map.flyTo(config.center, config.zoom, { animate: true, duration: 1.5 });
});

document.getElementById('recenter-btn').addEventListener('click', () => {
  if (userPosition) {
    map.flyTo(userPosition, 12, { animate: true, duration: 1.2 });
  } else {
    const config = countryConfig[currentRegion];
    map.flyTo(config.center, config.zoom, { animate: true, duration: 1.2 });
  }
});

const radarBtn = document.getElementById('radar-toggle');
radarBtn.addEventListener('click', () => {
  if (map.hasLayer(radarLayer)) {
    map.removeLayer(radarLayer);
    radarBtn.classList.remove('active');
  } else {
    radarLayer.addTo(map);
    radarBtn.classList.add('active');
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}