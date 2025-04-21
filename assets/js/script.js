let map;
let service;
let infowindow;
let markers = [];
let circles = [];
let totalResults = 0;
let userMarker = null;

function initMap() {
  infowindow = new google.maps.InfoWindow();


  const clearCirclesBtn = document.getElementById("clear-circles-btn");
  clearCirclesBtn.addEventListener("click", () => {
    clearMarkers();
    clearCircles();
    totalResults = 0;
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      function (position) {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const myLocation = new google.maps.LatLng(
          userLocation.lat,
          userLocation.lng
        );

        if (!map) {
          map = new google.maps.Map(document.getElementById("map"), {
            center: myLocation,
            zoom: 15,
          });

          google.maps.event.addListenerOnce(map, "idle", () => {
            searchPlaces(myLocation);
          });

          map.addListener("click", (e) => {
            clearMarkers();
            clearCircles();
            totalResults = 0;
            searchPlaces(e.latLng);
          });
        }

        updateMarker(myLocation);
      },
      function () {
        handleLocationError(true, map.getCenter());
      }
    );
  } else {
    userLocation = { lat: 30.41683, lng: -9.55175 };
    map = new google.maps.Map(document.getElementById("map"), {
      center: userLocation,
      zoom: 15,
    });

    new google.maps.Marker({
      position: userLocation,
      map: map,
      title: "Your Location",
    });

    searchPlaces(userLocation);
  }
  // Créer le bouton "Ajouter cercle vert"
const addGreenCircleControlDiv = document.createElement("div");

const addGreenCircleControl = document.createElement("button");
addGreenCircleControl.textContent = "➕ Cercle vert";
addGreenCircleControl.style.backgroundColor = "#27ae60";
addGreenCircleControl.style.color = "white";
addGreenCircleControl.style.border = "none";
addGreenCircleControl.style.padding = "10px";
addGreenCircleControl.style.margin = "10px";
addGreenCircleControl.style.borderRadius = "5px";
addGreenCircleControl.style.cursor = "pointer";
addGreenCircleControl.style.fontWeight = "bold";
addGreenCircleControl.title = "Ajouter un cercle vert";

addGreenCircleControlDiv.appendChild(addGreenCircleControl);

// Ajouter le bouton en haut à gauche de la carte
map.controls[google.maps.ControlPosition.TOP_LEFT].push(addGreenCircleControlDiv);

// Comportement du bouton
addGreenCircleControl.addEventListener("click", () => {
  addGreenCircleMode = true;
  addGreenCircleControl.textContent = "🟢 Cliquez sur la carte...";
  addGreenCircleControl.style.backgroundColor = "#2ecc71";
});
}

function updateMarker(location) {
  if (!userMarker) {
    userMarker = new google.maps.Marker({
      position: location,
      map: map,
      icon: { url: "https://maps.gstatic.com/mapfiles/ms2/micons/cabs.png" },
      title: "Your Location",
    });
  } else {
    userMarker.setPosition(location);
  }
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

function clearCircles() {
  circles.forEach((circle) => circle.setMap(null));
  circles = [];
}

function searchPlaces(location) {
  // Display the loader while the search is being performed
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  // Create the place search request
  const request = {
    location: location, // Now it's an object with numeric values
    radius: 1500, // Search radius in meters
    type: "pharmacy"
  };

  // Initialize the Places API service
  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);

  function callback(results, status, pagination) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
    results
      .filter(place => {
        const name = place.name.toLowerCase();
        const hasPharmacyType = place.types.includes("pharmacy");

        // ⚠️ Filtrage par mots-clés dans plusieurs langues
        const isLikelyPharmacy =
          name.includes("pharma");

        // Exclure certains types trop larges
        const isParapharmacy = place.types.includes("store");

        return hasPharmacyType && isLikelyPharmacy;
      })
      .forEach(place => createMarker(place));

    if (pagination && pagination.hasNextPage) {
      setTimeout(() => pagination.nextPage(), 2000);
    }
  }

  loader.style.display = "none";
}

}

function createMarker(place) {
  const placeLoc = place.geometry.location;

  const marker = new google.maps.Marker({
    map: map,
    position: placeLoc,
    title: place.name,
  });

  const circle = new google.maps.Circle({
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.25,
    map,
    center: placeLoc,
    radius: 300,
  });

  // On garde les références
  markers.push(marker);
  circles.push(circle);

  // ➕ Ajoute le listener sur le marker pour afficher l’infobulle avec bouton
  google.maps.event.addListener(marker, "click", function () {
    const request = { placeId: place.place_id };
    service.getDetails(request, function (details, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const content = `
  <div style="
    font-family: Arial, sans-serif;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid #ccc;
    background: #fefefe;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    max-width: 250px;
  ">
    <h3 style="margin: 0 0 10px; font-size: 16px; color: #2c3e50;">${details.name}</h3>
    <p style="margin: 0 0 10px; font-size: 14px; color: #555;">${details.formatted_address}</p>
    <a href="${details.url}" target="_blank" style="
      display: inline-block;
      margin-bottom: 10px;
      font-size: 13px;
      color: #3498db;
      text-decoration: none;
    "> Voir sur Google Maps</a><br>
    <button id="delete-marker-btn" style="
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 13px;
    ">Supprimer ce point</button>
  </div>
`;


        const infowindow = new google.maps.InfoWindow({ content });
        infowindow.open(map, marker);

        // Attendre que le DOM soit prêt pour ajouter l'action sur le bouton
        google.maps.event.addListenerOnce(infowindow, 'domready', () => {
          const deleteBtn = document.getElementById('delete-marker-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              marker.setMap(null);
              circle.setMap(null);

              // Supprime des tableaux pour éviter les fuites mémoire
              const mIndex = markers.indexOf(marker);
              if (mIndex > -1) markers.splice(mIndex, 1);

              const cIndex = circles.indexOf(circle);
              if (cIndex > -1) circles.splice(cIndex, 1);

              infowindow.close();
            });
          }
        });
      }
    });
  });
}

