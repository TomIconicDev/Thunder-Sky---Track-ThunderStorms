# Thunder Sky — Tactical Storm Tracker

An immersive, high-fidelity live storm radar application optimized for mobile and desktop web browsers. Thunder Sky combines minimal, atmospheric dark-mode mapping with real-time lightning simulation, precipitation radar data, and dynamic spatial audio to create an engaging storm-chasing interface.

**[Live Demo](https://tomiconicdev.github.io/Thunder-Sky---Track-ThunderStorms/)**

---

## Interface Features

* **Glassmorphism Controls:** Translucent, frosted-glass HUD designed to blend beautifully against midnight map tiles.
* **Real-time Precipitation Layer:** Live atmospheric reflectivity overlays directly onto your geographic view.
* **Geographical Soundwave Circles:** Expanding contextual tactical rings showing the physical propagation of thunder relative to your position, perfectly scaling during zoom adjustments.

---

## Technical Features & Enhancements

* **Geographically Scaled Propagation Circles:** Completely eliminated fixed-pixel DOM scaling artifacts. Thunder propagation waves are rendered using native Leaflet geometric elements defined in real-world meters. The rings scale flawlessly with the map matrix during multi-touch panning and pinch-zooming.
* **Targeted Region Control System:** Features an integrated region selector. Switching the target country dynamically pans and adjusts the viewport while restricting all automated real-time lightning strike simulations to coordinates inside that specific country's geographic boundaries.
* **Edge-to-Edge Zoom Safety:** Restricted map bounds (minimum zoom of 3 and maximum zoom of 18) to completely prevent missing tile request crashes or tile server errors.
* **Vector Graphical Elements:** All legacy character emojis have been entirely stripped out and replaced with sharp, minimal inline vector graphic paths that render crisply across high-density mobile screens.
* **Proximity Spatial Audio:** Automated trigger systems that play clean audio assets immediately when lightning strikes step within a 12-kilometer local hazardous threshold.
* **Real-time Radar Toggle:** Dedicated HUD action control allows users to instantly mute or activate live precipitation overlay vectors.
* **Mobile-First UX Architecture:** Full support for hardware viewport safety standards (viewport-fit=cover), touch prevention rules, and responsive glass docks that position smoothly around native mobile navigation bars.

---

## Architecture & Technologies Used

* **Core Engine:** Leaflet.js v1.9.4 (High-performance interactive mapping)
* **Base Styling Layer:** CartoDB Dark Matter Tiles (Premium dark atmospheric vector styling)
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