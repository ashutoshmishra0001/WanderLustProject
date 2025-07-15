document.addEventListener("DOMContentLoaded", () => {
  if (!mapCoordinates || mapCoordinates.length !== 2) {
    console.error("Invalid coordinates.");
    return;
  }

  const map = new maplibregl.Map({
    container: "map",
    style:
      "https://api.maptiler.com/maps/streets/style.json?key=jLvF2BdopqW9vYq2BXE0",
    center: listing.geometry.coordinates,
    zoom: 12,
  });

  map.addControl(new maplibregl.NavigationControl());

  // Create popup content
  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
    `<h4>${listing.location}</h4><p>Location Provided after booking</p>`
  );

  new maplibregl.Marker({ color: "red" })
    .setLngLat(mapCoordinates)
    .setPopup(popup) // attach the popup to the marker
    .addTo(map);
});
