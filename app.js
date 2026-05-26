// Country Bounding Boxes [minLat, minLng, maxLat, maxLng] and Centers
const countryConfig = {
  uk: { center: [54.5, -2.5], zoom: 6, bounds: [50.0, -7.5, 58.5, 1.5] },
  us: { center: [37.8, -96.0], zoom: 4, bounds: [25.0, -124.0, 49.0, -67.0] },
  de: { center: [51.1657, 10.4515], zoom: 6, bounds: [47.4, 5.9, 54.9, 15.0] },
  au: { center: [-25.2744, 133.7751], zoom: 4, bounds: [-39.0, 113.0, -11.0, 153.0] },
  br: { center: [-14.2350, -51.9253], zoom: 4, bounds: [-33.0, -73.0, 4.0, -34.0] }
};

let currentRegion = 'uk';
let mapCenter = countryConfig[currentRegion].center;

const map = L.map('map', {
  zoomControl: false,
  maxZoom: 18,
  minZoom: 3,
  inertia: true
}).setView(mapCenter, countryConfig[currentRegion].zoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CARTO',
  subdomains: 'abcd',
  maxZoom: 18
}).addTo(map);

const radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png', {
  opacity: 0.35,
  maxZoom: 18
}).addTo(map);

// Minimal inline Vector Lightning Icon (No emojis used)
const lightningIcon = L.divIcon({
  html: `<svg class="lightning-svg-icon" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  className: 'lightning-marker-node',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function createLightningStrike(lat, lon, distance) {
  const marker = L.marker([lat, lon], { icon: lightningIcon }).addTo(map);

  // GEOGRAPHIC LAYER FIXED: Standard Leaflet Circle scaled in real-world meters
  const physicalRadiusMeters = distance * 1000; 
  
  const geoCircle = L.circle([lat, lon], {
    radius: 0, 
    color: '#007aff',
    weight: 1.5,
    fillColor: '#007aff',
    fillOpacity: 0.15,
    interactive: false
  }).addTo(map);

  // Precise Frame Interval Logic for seamless geographic expansion matching map zooming
  let currentRadius = 0;
  let maxSteps = 60;
  let currentStep = 0;

  const expansionLoop = setInterval(() => {
    currentStep++;
    if (currentStep >= maxSteps) {
      clearInterval(expansionLoop);
      map.removeLayer(marker);
      map.removeLayer(geoCircle);
    } else {
      const progress = currentStep / maxSteps;
      currentRadius = physicalRadiusMeters * progress;
      
      geoCircle.setRadius(currentRadius);
      geoCircle.setStyle({
        opacity: 1 - progress,
        fillOpacity: 0.15 * (1 - progress)
      });
    }
  }, 30); // ~30ms update frequency loop

  document.getElementById("distance").innerHTML = `${distance} <span class="unit">km</span>`;
  document.getElementById("delay").innerHTML = `${Math.round(distance * 2.91)} <span class="unit">sec</span>`;

  if (distance < 12) {
    const audio = document.getElementById("thunderAudio");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }
}

function randomLightning() {
  const config = countryConfig[currentRegion];
  const bounds = config.bounds;

  // Generate randomized coordinates locked securely inside the selected country envelope
  const lat = bounds[0] + (Math.random() * (bounds[2] - bounds[0]));
  const lon = bounds[1] + (Math.random() * (bounds[3] - bounds[1]));
  const distance = Math.floor(Math.random() * 25) + 1;

  createLightningStrike(lat, lon, distance);
}

let strikeTimer = setInterval(randomLightning, 3000);

// Dynamic Region Switching Interface 
document.getElementById('country-selector').addEventListener('change', (e) => {
  currentRegion = e.target.value;
  const config = countryConfig[currentRegion];
  
  map.flyTo(config.center, config.zoom, {
    animate: true,
    duration: 1.5
  });
});

document.getElementById('recenter-btn').addEventListener('click', () => {
  const config = countryConfig[currentRegion];
  map.flyTo(config.center, config.zoom, { animate: true, duration: 1 });
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