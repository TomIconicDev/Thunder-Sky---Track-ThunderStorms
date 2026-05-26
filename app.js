// Global user location anchors
let currentUserLat = 51.5072;
let currentUserLng = -0.1276;
let userLocMarker = null;

// 1. INITIALIZE ENGINE MATRIX WITH RIGID ACCURATE MAX ZOOM CAP
const map = L.map('map', {
  zoomControl: false,
  maxZoom: 18,    // Fixed out at 18. Will NEVER fetch bad missing squares again.
  minZoom: 3,
  inertia: true
}).setView([currentUserLat, currentUserLng], 7);

// DARK ATMOSPHERIC NIGHT BASE LAYER
const baseLayer = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap & CARTO',
    subdomains: 'abcd',
    maxZoom: 18
  }
).addTo(map);

// NOWCASTING TACTICAL RADAR REFLECTIVITY OVERLAY
const radarLayer = L.tileLayer(
  'https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png',
  {
    opacity: 0.45,
    maxZoom: 18
  }
).addTo(map);

// Structural custom HTML interfaces for Lightning nodes
const lightningIcon = L.divIcon({
  html: '<div class="lightning-icon-inner">⚡</div>',
  className: 'lightning-icon-wrapper',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

function createLightningStrike(lat, lon, distance) {
  // Spawn lightning pin
  const marker = L.marker([lat, lon], { icon: lightningIcon }).addTo(map);

  // FIXED FLOATING MATRIX: Spawn pure HTML DivIcons mapping perfectly to CSS timelines 
  const soundwaveIcon = L.divIcon({
    className: 'thunder-ring-wrapper',
    html: '<div class="expanding-ring-element"></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  const soundwaveRing = L.marker([lat, lon], { icon: soundwaveIcon }).addTo(map);

  // Safely display real-time tracking metrics 
  document.getElementById("distance").innerHTML = `${distance} <span class="unit">km</span>`;
  document.getElementById("delay").innerHTML = `${Math.round(distance * 2.91)} <span class="unit">sec</span>`;

  // Local Proximity Spatial Audio trigger conditions
  if (distance < 12) {
    const audio = document.getElementById("thunderAudio");
    if (audio) {
      audio.currentTime = 0; // Restart sound immediately if strikes overlap
      audio.play().catch(() => {});
    }
  }

  // Persistent 20-second historical lifecycle clean sweep rule
  setTimeout(() => {
    if (map.hasLayer(marker)) map.removeLayer(marker);
    if (map.hasLayer(soundwaveRing)) map.removeLayer(soundwaveRing);
  }, 20000);
}

function randomLightning() {
  const center = map.getCenter();
  
  // Calculate cluster variations surrounding the user's active viewport scope
  const lat = center.lat + ((Math.random() - 0.5) * 1.2);
  const lon = center.lng + ((Math.random() - 0.5) * 1.2);
  const distance = Math.floor(Math.random() * 28) + 1;

  createLightningStrike(lat, lon, distance);
}

// Spawn automated monitoring loop
setInterval(randomLightning, 3800);

// NATIVE PERMISSION GEOLOCATION INTERFACE HOOK
function trackUserDevice() {
  document.getElementById("status").innerText = "Locating GPS...";
  
  navigator.geolocation.getCurrentPosition((pos) => {
    currentUserLat = pos.coords.latitude;
    currentUserLng = pos.coords.longitude;

    map.setView([currentUserLat, currentUserLng], 10);
    document.getElementById("status").innerText = "Live Storm Tracking";

    // Re-draw or position structural marker nodes seamlessly without layout displacement artifacts
    if (!userLocMarker) {
      const userIcon = L.divIcon({
        className: 'user-marker-wrapper',
        html: '<div class="user-gps-core"></div><div class="user-gps-pulse"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      userLocMarker = L.marker([currentUserLat, currentUserLng], { icon: userIcon }).addTo(map);
    } else {
      userLocMarker.setLatLng([currentUserLat, currentUserLng]);
    }
  }, (err) => {
    document.getElementById("status").innerText = "Live (GPS Disabled)";
    console.warn("Location permission variant missing. Preserving framework anchor.");
  }, {
    enableHighAccuracy: true
  });
}

// Run location tracker initialization
trackUserDevice();

// 2. INTERACTIVE UI ACTION DOCK BINDINGS
document.getElementById('recenter-btn').addEventListener('click', () => {
  map.flyTo([currentUserLat, currentUserLng], 10, {
    animate: true,
    duration: 1.2
  });
  trackUserDevice();
});

const radarBtn = document.getElementById('radar-toggle');
radarBtn.addEventListener('click', () => {
  if (map.hasLayer(radarLayer)) {
    map.removeLayer(radarLayer);
    radarBtn.classList.remove('active');
    document.getElementById("status").innerText = "Radar Layer Muted";
  } else {
    radarLayer.addTo(map);
    radarBtn.classList.add('active');
    document.getElementById("status").innerText = "Live Storm Tracking";
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}