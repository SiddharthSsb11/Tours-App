export const displayMap = (locations) => 
{
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2lkZGhhcnRoc3NiIiwiYSI6ImNrb2lsajFwYTAwbW0ycHFmbXRjbHhsdWQifQ.FP1MhvKiPvLzIGgFFeRxQg';

//   const locations = JSON.parse(
//     document.getElementById('map').dataset.locations
//   );
//   //console.log(locations);

//   mapboxgl.accessToken =
//     'pk.eyJ1Ijoic2lkZGhhcnRoc3NiIiwiYSI6ImNrb2lsajFwYTAwbW0ycHFmbXRjbHhsdWQifQ.FP1MhvKiPvLzIGgFFeRxQg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/siddharthssb/ckoiwhnt50m3317o2o64141sm',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    zoom: 1000,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
  //navigation btn//zoom-in-out btn
  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-right');
};

////////////////////////////////////////////////////////////////LEAFLET

// const locations = JSON.parse(document.getElementById('map').dataset.locations);

// var map = L.map('map', { zoomControl: false });

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

// const points = [];
// locations.forEach((loc) => {
//   points.push([loc.coordinates[1], loc.coordinates[0]]);
//   L.marker([loc.coordinates[1], loc.coordinates[0]])
//     .addTo(map)
//     .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, { autoClose: false })
//     .openPopup();
// });

// const bounds = L.latLngBounds(points).pad(0.5);
// map.fitBounds(bounds);

// map.scrollWheelZoom.disable();

// tour.pug:
// block append head
//    link(rel='stylesheet' href='https://unpkg.com/leaflet@1.6.0/dist/leaflet.css')
//    script(src='https://unpkg.com/leaflet@1.6.0/dist/leaflet.js')
//    script(src='/js/leaflet.js' defer)
