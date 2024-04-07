var startLocation = [40.76343000, -73.98625000];
var map;
var mapCenter;
var garageList = [];
var markers = [];
var selectedMarker = null;

document.addEventListener("DOMContentLoaded", event => {
    mapCenter = new google.maps.LatLng(startLocation[0], startLocation[1]);
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        streetViewControl: false,
        mapTypeControl: false,
        center: mapCenter,
        mapId: "c6bd309a43d6680f"
    });
    navigator.geolocation.getCurrentPosition(setCoordinates);
    google.maps.event.addListener(map, "dragend", async function() {
        mapCenter = await this.getCenter();
        garageList = [];
        deleteMarkers();
        await fillGarageList();
    });
    fillGarageList();
});

async function fillGarageList() {
    await firebase.firestore().collection("Garage")
    .where("Lng", ">", mapCenter.lng() - 0.02)
    .where("Lng", "<", mapCenter.lng() + 0.02)
    .where("Lat", ">", mapCenter.lat() - 0.015)
    .where("Lat", "<", mapCenter.lat() + 0.015)
    .orderBy("Lng")
    .get()
    .then((querySnapshot) => {
        deleteGarageCards();
        querySnapshot.forEach(async (doc) => {
            const data = doc.data()
            garageList.push(data);
            await addMapMarker(data, doc.id);
        });
    })
    .catch((error) => {
        console.log("Error getting garages: " + error);
    });
}

async function setCoordinates(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const latlng = new google.maps.LatLng(lat, lng);
    map.setCenter(latlng);
    mapCenter = latlng;
    garageList = [];
    deleteMarkers();
    await fillGarageList();
}

async function addMapMarker(garageData, garageID) {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { PinElement } = await google.maps.importLibrary("marker");
    var pin = new PinElement({
        borderColor: "#ebab59",
        background: "#ebab59",
        glyphColor: "#db741f",
        scale: 1.0,
    });
    var marker = new AdvancedMarkerElement({
        position: new google.maps.LatLng(garageData.Lat, garageData.Lng),
        map: map,
        title: garageData.Name,
        content: pin.element
    });
    marker.addListener('click', function() {
        selectGarageMarker(marker);
        selectGarageCard(garageID);
    });
    displayOneGarage(garageData, garageID, marker);
    markers.push(marker);
}

function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }
  
function deleteMarkers() {
    setMapOnAll(null);
    markers = [];
}

function displayOneGarage(data, garageID, marker) {
    let garageList = document.getElementById('GarageList');
    var newGarage = document.createElement('li');
    newGarage.className = 'bg-slate-300 p-3 mb-3 rounded-xl hover:bg-slate-400';
    var pName = document.createElement('p');
    var pAddress = document.createElement('p');
    const gName = data.Name;
    const gAddress = data.Address + ", " + data.AreaCode;
    pName.innerHTML = gName;
    pAddress.innerHTML = gAddress;
    newGarage.id = garageID;
    newGarage.appendChild(pName);
    newGarage.appendChild(pAddress);
    newGarage.onclick = function() {
        selectGarageMarker(marker);
        selectGarageCard(garageID);
    };
    garageList.appendChild(newGarage);
}

function deleteGarageCards() {
    let garageList = document.getElementById('GarageList');
    garageList.innerHTML = "";
}

function selectGarageCard(garageID) {
    let garageList = document.getElementById("GarageList");
    for (var child of garageList.children) {
        child.classList.remove("bg-slate-400");
        child.classList.add("bg-slate-300");
    }
    let card = document.getElementById(garageID);
    card.classList.remove("bg-slate-300");
    card.classList.add("bg-slate-400");
}

async function selectGarageMarker(marker) {
    const { PinElement } = await google.maps.importLibrary("marker");
    var smallPin = new PinElement({
        borderColor: "#ebab59",
        background: "#ebab59",
        glyphColor: "#db741f",
        scale: 1.0,
    });
    var largePin = new PinElement({
        borderColor: "#ebab59",
        background: "#ebab59",
        glyphColor: "#db741f",
        scale: 1.5,
    });
    if (selectedMarker != null) {
        selectedMarker.content = smallPin.element;
    }
    marker.content = largePin.element;
    selectedMarker = marker;
    map.panTo(selectedMarker.position);
}

function handleBookButton() {

}