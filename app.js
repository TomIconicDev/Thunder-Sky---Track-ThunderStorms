const map = L.map('map', {
  zoomControl: false,
  maxZoom: 19,
  minZoom: 3
}).setView([51.5072, -0.1276], 7);

// DARK NIGHT MAP
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap & CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }
).addTo(map);

// RADAR
L.tileLayer(
  'https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png',
  {
    opacity: 0.45,
    maxZoom: 20
  }
).addTo(map);

// CUSTOM ZOOM
L.control.zoom({
  position: 'bottomright'
}).addTo(map);

const lightningIcon = L.divIcon({
  html: '⚡',
  className: 'lightning-icon',
  iconSize: [30, 30]
});

const activeStrikes = [];

function createLightningStrike(lat, lon, distance) {

  const marker = L.marker([lat, lon], {
    icon: lightningIcon
  }).addTo(map);

  const circle = L.circle([lat, lon], {
    color: '#66b3ff',
    fillColor: '#66b3ff',
    fillOpacity: 0.08,
    radius: distance * 180,
    weight: 2,
    className: 'ring'
  }).addTo(map);

  activeStrikes.push(marker);
  activeStrikes.push(circle);

  document.getElementById("distance").innerText =
    `${distance} km`;

  document.getElementById("delay").innerText =
    `${Math.round(distance * 2.91)} sec`;

  if(distance < 10){
    document.getElementById("thunderAudio")
      .play()
      .catch(() => {});
  }

  // KEEP STRIKES FOR 20 SECONDS
  setTimeout(() => {
    map.removeLayer(marker);
    map.removeLayer(circle);
  }, 20000);
}

function randomLightning() {

  const center = map.getCenter();

  const lat =
    center.lat + ((Math.random() - 0.5) * 1.4);

  const lon =
    center.lng + ((Math.random() - 0.5) * 1.4);

  const distance =
    Math.floor(Math.random() * 30) + 1;

  createLightningStrike(lat, lon, distance);
}

// SPAWN STRIKES
setInterval(randomLightning, 3500);

// USER LOCATION
navigator.geolocation.getCurrentPosition((pos) => {

  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  map.setView([lat, lon], 10);

  L.circleMarker([lat, lon], {
    radius: 8,
    color: '#fff',
    fillColor: '#66b3ff',
    fillOpacity: 1
  }).addTo(map);

});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
