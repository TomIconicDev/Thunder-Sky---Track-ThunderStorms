# Thunder Sky — Tactical Storm Tracker

An immersive, high-fidelity live storm radar application optimized for mobile and desktop web browsers. Thunder Sky combines minimal, atmospheric dark-mode mapping with real-time lightning simulation, precipitation radar data, and severity metrics to create an engaging storm-chasing interface.

**[Live Demo](https://tomiconicdev.github.io/Thunder-Sky---Track-ThunderStorms/)**

---

## Interface Features

* **Glassmorphic Cockpit HUD:** Translucent, frosted-glass telemetry layers designed to blend beautifully against dark vector map tiles.
* **Interactive Inspection Panel:** Click or tap any live map indicator or propagation ring to slide up real-time historical node diagnostics.
* **True Scale Geographic Propagation Circles:** Expanding vector rings mapped in real-world meters that correctly scale alongside map zooming interactions.

---

## Technical Features & Enhancements

* **On-Demand Node Interception:** Built structural object binding onto interactive map vectors. Tapping an element registers a pause routine on its expansion lifecycle and isolates coordinates, magnitude classification values, and audibility metrics within a contextual inspection HUD layout.
* **Micro-Dot Vector Markers:** Replaced bulky graphical configurations with a razor-sharp high-density dot core profile surrounded by localized lighting element glow matrices.
* **Hardware Position Tracking Engine:** Uses an active geolocation watch loop to parse device movement, keeping high-accuracy location tracking synced seamlessly.
* **Rigid Zoom Threshold Restraints:** Hard-capped tactical engine properties to a maximum zoom level of 16. This restriction prevents the application from making invalid asset requests, fixing missing tile server errors.
* **3-Minute Event Longevity:** Strike events and their geographic propagation footprints accumulate dynamically on-screen across your selected country for 180 seconds before cycling out of memory.
* **Seismographic Severity Scale (Magnitude Matrix):** Modeled directly after the Richter scale for natural phenomena. Strikes are analyzed and assigned a power classification value from Magnitude 1.0 to 10.0.
* **Atmospheric Acoustical Range Evaluation:** Calculates the actual shockwave travel threshold (Miles Heard) before structural audio degradation takes place, displaying clear telemetry across the metric dashboard.

---

## Architecture & Technologies Used

* **Core Engine:** Leaflet.js v1.9.4 (High-performance interactive mapping)
* **Base Styling Layer:** CartoDB Dark Matter Tiles (Dark atmospheric vector styling)
* **Radar Stream Layer:** RainViewer Nowcasting API (Real-time global precipitation data)
* **Visual Assets:** FontAwesome 6 Pro (Streamlined typography iconography)
* **PWA Core:** Native HTML5 Service Workers (sw.js) and modern standalone Application Manifest configurations.

---

## Quick Start / Local Deployment

Because the application is written entirely in vanilla JavaScript, HTML5, and CSS3, it does not require a build step or bundler dependencies.

### 1. Clone the Repository
```bash
git clone [https://github.com/TomIconicDev/Thunder-Sky---Track-ThunderStorms.git](https://github.com/TomIconicDev/Thunder-Sky---Track-ThunderStorms.git)
cd Thunder-Sky---Track-ThunderStorms