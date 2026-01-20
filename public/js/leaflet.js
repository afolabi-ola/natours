/* eslint-disable */
import leaflet from 'leaflet';

export function displayMap(locations) {
  const map = leaflet.map('map');

  // Disable scroll wheel zoom initially
  map.scrollWheelZoom.disable();

  // Enable zoom when the user clicks/focuses the map
  map.on('focus', () => {
    map.scrollWheelZoom.enable();
  });

  // Disable zoom again when the user clicks away
  map.on('blur', () => {
    map.scrollWheelZoom.disable();
  });

  leaflet
    .tileLayer(
      'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    )
    .addTo(map);

  // Create bounds to fit all markers
  const bounds = [];

  locations.forEach((loc) => {
    const [lng, lat] = loc.coordinates;

    // Create a custom HTML-based marker
    const customIcon = leaflet.divIcon({
      className: 'marker',
      html: `<div> </div>`,
      iconSize: [34, 42],
      iconAnchor: [17, 22],
    });

    leaflet
      .marker([lat, lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
        className: 'custom-popup',
      })
      .openPopup();

    bounds.push([lat, lng]);
  });

  // Set initial view to the first location at a high zoom
  const firstCoords = [
    locations[0].coordinates[1],
    locations[0].coordinates[0],
  ];
  map.setView(firstCoords, 12);

  // Then fly out to show everything
  // map.flyToBounds(bounds, { padding: [150, 150], duration: 3 });
  setTimeout(() => {
    map.flyToBounds(bounds, {
      padding: [150, 150],
      duration: 3,
    });
  }, 100);
}
