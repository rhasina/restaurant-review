var map;

/*-----------------------------------------------------------------------------------
Initialize the map
-------------------------------------------------------------------------------------*/
const initMap = () =>{
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5haGEiLCJhIjoiY2tqODk5ZmU3NnJpbDJ1cWo1aWVkZHpjbyJ9.ZJkW6h9URnbv_q8hL7ltMA';
    let center=  [47.50568495871539,-18.875826455294447]; // [lng, lat]
    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            // User's current position
            center = [position.coords.longitude, position.coords.latitude];
        });
    }
    else{
        console.log("Your browser doesn't support geolocation");
    }

    // Create map
    map = new mapboxgl.Map({
        container: 'map', // HTML container id
        style: 'mapbox://styles/mapbox/streets-v11', // style URL                                                                                             
        center: center, // starting position as [lng, lat]
        zoom: 13
    });
    map.addControl(new mapboxgl.NavigationControl());
               
    // Add custom marker to the map
    let elt = document.createElement('div');
    elt.className = 'marker';
    new mapboxgl.Marker(elt)
    .setLngLat(center)
    .addTo(map); 
}



