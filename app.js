const map = L.map('map').setView([51.5072, -0.1276], 6);

L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenStreetMap'
  }
).addTo(map);

// RainViewer radar
L.tileLayer(
  'https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png',
  {
    opacity: 0.5
  }
).addTo(map);

const lightningIcon = L.divIcon({
  html: '⚡',
  className: 'lightning-icon',
  iconSize: [30, 30]
});

function randomLightning() {
  const lat = 51.3 + (Math.random() * 2);
  const lon = -0.5 + (Math.random() * 2);

  const marker = L.marker([lat, lon], {
    icon: lightningIcon
  }).addTo(map);

  const distance = Math.floor(Math.random() * 25) + 1;

  document.getElementById("distance").innerText =
    `${distance} km`;

  document.getElementById("delay").innerText =
    `${distance * 3} sec`;

  if(distance < 8){
    document.getElementById("thunderAudio").play().catch(() => {});
  }

  setTimeout(() => {
    map.removeLayer(marker);
  }, 5000);
}

setInterval(randomLightning, 4000);

navigator.geolocation.getCurrentPosition((pos) => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  map.setView([lat, lon], 8);

  L.circleMarker([lat, lon], {
    radius: 8
  }).addTo(map);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
