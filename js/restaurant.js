let storage= new Store();
/*-----------------------------------------------------------------------------------
Load json
-------------------------------------------------------------------------------------*/
 function fetchRestaurant ()  {
    const jsonRestaurant='js/restaurant.json'; 
    fetch(jsonRestaurant).then((response) => response.json()).then((data)=>{
        storage.drop();
        // Add to local storage 
        storage.addToLocalStorage(data);          
    }
    ).catch((error) => console.error(error));
}

/*-----------------------------------------------------------------------------------
Load api
-------------------------------------------------------------------------------------*/
function  fetchApi  (){
    // Access longitude and latitude values directly    
    let coordinates = map.getCenter();
    let api= "https://api.foursquare.com/v2/venues/explore?client_id=50SD2VHPHPZEZK1FPO12O1NASI2YRWXBKVAX5HL0TCE0ZXGB&client_secret=VZRBKXRW2W2NQC2NB3LDP540XEQJNMHUZE2SITMEON3A0Y3P&categoryId=4d4b7105d754a06374d81259&venuePhotos=1&ll="+coordinates.lat+","+coordinates.lng+"&v=20180604&radius=3000&limit=3";

    // Get restaurants near current position
    fetch(api).then((response) => response.json()).then((data)=>{
        let apiRestaurants= data.response.groups;
        return apiRestaurants}).then( ( groups) =>{
            // Get restaurant details
            groups.forEach(function(restaurants){
                restaurants.items.forEach(function(restaurant) {
                    let detailsApi="https://api.foursquare.com/v2/venues/"+restaurant.venue.id+"?client_id=50SD2VHPHPZEZK1FPO12O1NASI2YRWXBKVAX5HL0TCE0ZXGB&client_secret=VZRBKXRW2W2NQC2NB3LDP540XEQJNMHUZE2SITMEON3A0Y3P&v=20180604";
                    fetch(detailsApi).then((response) => response.json()).then((data)=>{
                        let details=data.response.venue;                        
                        let review = details.tips.groups[0].items[0].text;
                        let resto = {
                            "id":restaurant.venue.id,
                            "source":"api",
                            "restaurantName":restaurant.venue.name,
                            "address":restaurant.venue.location.address|| restaurant.venue.location.country,
                            "lat":restaurant.venue.location.lat,
                            "long":restaurant.venue.location.lng,
                            "ratings":details.rating? [{"stars":Math.round(details.rating/2),"comment": review}]: [],
                            "url": details.photos.count!==0? details.photos.groups[0].items[0].prefix + "90x90" +  details.photos.groups[0].items[0].suffix : "img/eat.png"
                        }
                        storage.addToLocalStorage([resto]);
                        filterRestaurant();                        
                    }).catch((error) => console.error(error));
                });                            
            });            
        }).catch((error) => console.error(error));
}

/*-----------------------------------------------------------------------------------
Create a restaurant item
-------------------------------------------------------------------------------------*/
/* Create a restaurant item on the sidebar */
const buildRestaurantItem = (restaurant) =>{    
    let listings = document.getElementById('listings');

    // Create an Item 
    let listing = listings.appendChild(document.createElement('div'));
    addMarkerToRestaurant(restaurant);

    /* Assign a unique `id` to the listing. */
    listing.id = "listing-" + restaurant.id;

    /* Assign the `item` class to each listing for styling. */
    listing.className = 'item';

    // Add image to the item
    let imgWrapper= listing.appendChild(document.createElement('div'));
    let imgElt= imgWrapper.appendChild(document.createElement("img"));
    imgElt.classList.add("item-img")
    imgElt.src=restaurant.url;
  
    /* Add the link to the item created above. */
    let linkWrapper= listing.appendChild(document.createElement("div"));
    let  link = linkWrapper.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'item-title';
    link.id = "link-" + restaurant.id;
    link.innerHTML = restaurant.restaurantName;    

    /* Add details to the individual listing. */
    let details = listing.appendChild(document.createElement('div'));
    details.classList.add('item-details');
    details.innerHTML = restaurant.address;  

    /*Add average rating to the individual listing */
    let rating = listing.appendChild(document.createElement('div'));
    rating.classList.add('item-rating');
    let average=rating.appendChild(document.createElement('span'));
    average.classList.add('badge');
    average.classList.add('item-average');
    average.innerHTML = getAverageRating(restaurant.ratings); 

    /*Add stars for average rating to the individual listing */
    let star=rating.appendChild(document.createElement('span'));
    star.classList.add('item-star');
    star.innerHTML= starRating(getAverageRating(restaurant.ratings));

    /*Add total of reviews to the individual listing */
    let review = rating.appendChild(document.createElement('span'));
    review.classList.add('item-review');
    review.innerHTML= 'Reviews: (' + restaurant.ratings.length+')';

    /* Event Listener on link */
    hoverOnListItem(link);          
}

/* Get average rating for array of ratings*/
const getAverageRating = (ratings) =>{
    if (ratings.length >0){
    let total = 0;
    for (let i = 0; i < ratings.length; i++) {
        total += Number( ratings[i].stars);
    }    
    let average = Number.parseFloat(total / ratings.length).toFixed(1);
    return average;  }
    else{
        return 0;
    }
}

/* Create star ratings from a value of rating in comment */
function starRating(commentRating) {  
    let emptyStar = '\u2606',    
    fullStar = '\u2605';
    let decimal= Number.parseFloat((commentRating -Math.floor(commentRating)).toFixed(1));
    var rating = '';
    for (let i = 0; i< 5; i += 1) {
        if (i < Math.floor(commentRating)) {
            rating += fullStar;
        }
        else if(i === Math.floor(commentRating) && decimal>0.7 ){
            rating += fullStar;
        }
        else {
            rating += emptyStar;
        }
    }  
    return rating;
}

/* Create event listener on restaurant item (link) */
const hoverOnListItem = (link) =>{
    // Display a popup on hover on restaurant item 
    link.addEventListener('mouseenter', function(e){ 
        let restaurants=storage.getCollection();
        for (let i=0; i < restaurants.length; i++) {
            if (this.id === "link-" + restaurants[i].id) {
                let clickedListing = restaurants[i];
                createPopUp(clickedListing);
            }
        } 
        
        // Remove the active class on other restaurant item
        let activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
            activeItem[0].classList.remove('active');
        }

        // Add the active class to the current restaurant item
        this.parentNode.parentNode.classList.add('active');
    });

    link.addEventListener('mouseout', function(e){
        let activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
            activeItem[0].classList.remove('active');
        }

        /* Check if there is already a popup on the map and if so, remove it */
        var popUps = document.getElementsByClassName('mapboxgl-popup');        
        if (popUps[0]) popUps[0].remove();        
    });
}

/*-----------------------------------------------------------------------------------
Display a restaurant on the map
-------------------------------------------------------------------------------------*/
/* Add a marker to the restaurant */
const addMarkerToRestaurant=(restaurant)=> {
    // Create a div element for the marker.
    let divElt = document.createElement('div');

    // Assign a unique `id` to the marker. 
    divElt.id = "marker-" + restaurant.id;

    divElt.classList.add('resto-marker'); 

    // Create a marker using the div element and add it to the map
    new mapboxgl.Marker(divElt, { offset: [0, -23] })
    .setLngLat([restaurant.long,restaurant.lat])
    .addTo(map);
    clickOnMarker(divElt, restaurant);     
}

/* Create a click event listener on the marker  */
const clickOnMarker = (markerElt,restaurant) =>{
    markerElt.addEventListener('click', function(e){
        /* Close all other popups and display popup for clicked restaurant */
        createPopUp(restaurant);

        /* Highlight listing in sidebar */
        let activeItem = document.getElementsByClassName('active');
        e.stopPropagation();
        if (activeItem[0]) {
            activeItem[0].classList.remove('active');
        }
        let listing = document.getElementById('listing-' + restaurant.id);
        listing.classList.add('active');
    });    
}

/* Create a pop-up to display restaurant info */
function createPopUp(currentRestaurant) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    /** Check if there is already a popup on the map and if so, remove it */
    if (popUps[0]) popUps[0].remove();
    var popup = new mapboxgl.Popup({ closeOnClick: false })
    .setLngLat([currentRestaurant.long,currentRestaurant.lat])
    .setHTML('<h3 class="popup-title">'+ currentRestaurant.restaurantName + '</h3>' +
     '<span class="popup-average">'+getAverageRating(currentRestaurant.ratings)+'</span>'+'<span class="popup-star">'+ starRating(getAverageRating(currentRestaurant.ratings))+'</span>'+
    '<span class="popup-review"> ('+ currentRestaurant.ratings.length+')</span>')
    .addTo(map);
}

/*-----------------------------------------------------------------------------------
Display restaurant reviews 
-------------------------------------------------------------------------------------*/
/* Show the review block and display reviews for a restaurant*/
function showRestaurantReview(restaurantLinkId){
    // Store the current restaurant link 
    document.getElementById("new-review").value=restaurantLinkId;
    
    // Show the review block 
    document.getElementById("review-info").style.display="block";   
    
    // Find the selected restaurant in the localStorage
    let restaurants=storage.getCollection();
    let result= restaurants.filter(restaurant => restaurantLinkId=== "link-"+ restaurant.id);
    
    if(result.length>0){     
        // Display all the reviews for the current Restaurant        
        displayReviews(result[0]);               
    }
    else{
        console.log("Restaurant not found");
    } 
}

/* Display all the reviews */
const displayReviews = (restaurant) =>{    
    document.getElementById("your-resto").innerHTML=restaurant.restaurantName;

    /* Display the restaurant info */
    let restaurantName= document.getElementById("review-name");
    let restaurantAdress= document.getElementById("review-address");
    let restoAverage=document.getElementById("review-average");
    let restoReview=document.getElementById("review-comment");
    let restoStar=document.getElementById("review-star");    
    restaurantName.innerHTML= restaurant.restaurantName;
    restaurantAdress.innerHTML= restaurant.address;
    restoAverage.innerHTML=getAverageRating(restaurant.ratings);
    restoReview.innerHTML='Reviews: (' + restaurant.ratings.length+')';
    restoStar.innerHTML=starRating(getAverageRating(restaurant.ratings));

    /* Display all the review */
    let reviewElt=document.getElementById("review-list");
    reviewElt.innerHTML='';
    let currentRatings=restaurant.ratings;
    for (let i=0, l= currentRatings.length; i < l; i++) {
        let itemElt= reviewElt.appendChild(document.createElement('div'));
        itemElt.classList.add("review-item");

        let ratingElt=itemElt.appendChild(document.createElement('div'));
        
        let starElt = ratingElt.appendChild(document.createElement('span'))
        starElt.classList.add("item-star");  

        let commentElt= itemElt.appendChild(document.createElement('div'));

        let textElt = commentElt.appendChild(document.createElement('p'));
        textElt.classList.add("review-comment");

        starElt.innerHTML=starRating(currentRatings[i].stars);              
        textElt.innerHTML=currentRatings[i].comment;        
    }    
}

/* Click on a restaurant item to display reviews */
let listingsElt=document.getElementById("listings");
listingsElt.addEventListener("click",function(e){
    if(e.target.classList.contains("item-title")){
        let restaurantLinkId=e.target.id;
        showRestaurantReview(restaurantLinkId);
    }
});

/* Click on close button to close the review block */
let closeBtn= document.getElementById("close-review");
closeBtn.addEventListener("click", function(e){
    document.getElementById("review-info").style.display="none";
});


/*-----------------------------------------------------------------------------------
Add new review to an existing restaurant 
-------------------------------------------------------------------------------------*/
/* Save the new review */
function saveReview(){
    let restaurantLinkId=document.getElementById("new-review").value;

    // Display a messay error if the review is empty
    if (document.getElementById('your-review').value === '') {
        document.getElementById('addCommentError').style.display="block";
    } 
    else{
        // Get the values entered by the user
        let review= document.getElementById("your-review").value;
        let rating = document.getElementById('userRating').value;
        let newReview= {
            "stars" : rating,
            "comment":review
        };
        
        // Look for the restaurant in the localstorage
        let currentRestaurant;
        let restaurants=storage.getCollection();
        let result= restaurants.filter(restaurant => restaurantLinkId=== "link-"+ restaurant.id);
        if(result.length>0){
            // Update the localstorage
            currentRestaurant=result[0];
            storage.update(restaurants,currentRestaurant.id,newReview);

            // Update the UI
            let average =document.querySelector("#listing-"+currentRestaurant.id +" .item-average");
            let review=document.querySelector("#listing-"+currentRestaurant.id +" .item-review");
            let star=document.querySelector("#listing-"+currentRestaurant.id +" .item-star");                  
            average.innerHTML = getAverageRating(currentRestaurant.ratings); 
            star.innerHTML= starRating(getAverageRating(currentRestaurant.ratings));    
            review.innerHTML= 'Reviews: (' + currentRestaurant.ratings.length+')';
            
            displayReviews(currentRestaurant);

            // Close Modal            
            document.getElementById("close-modal").click();

            // Clear textarea
            document.getElementById('your-review').value='';
        }
        else{
            console.log("restaurant not found");
        }
    }
}

/* Click on the add review button to save a review */
let reviewForm=document.getElementById("modalReview");
reviewForm.addEventListener("click",function(e){
    if(e.target.id==="modal-add-review"){
        saveReview();
    }
});

/* Close display error when adding new comment*/
document.getElementById('your-review').addEventListener("keyup",() => {
    document.getElementById('addCommentError').style.display="none";
});
document.getElementById("add-review").addEventListener("click", ()=>{
    document.getElementById('addCommentError').style.display="none";
});

/*-----------------------------------------------------------------------------------
Filter restaurant list by rating 
-------------------------------------------------------------------------------------*/
/* Create list of restaurant according to the filter */
const buildRestaurantList = (minRate, maxRate) =>{
    let restaurants=storage.getCollection();
    
    // Get the filtered restaurants
    let filteredRestaurant = restaurants.filter(restaurant=> {
         return getAverageRating(restaurant.ratings) >= minRate && getAverageRating(restaurant.ratings) <= Number(maxRate).toFixed(1);
    });
    
    // Delete previous markers 
    let markers= document.querySelectorAll('.resto-marker');       
    if (markers.length!==0){        
        markers.forEach(function(marker){
            marker.remove();
        }); 
    } 
    
    // Create the restaurant list
    let listing = document.getElementById('listings');
    listing.innerHTML='';    
    filteredRestaurant.forEach((restaurant) =>{
        buildRestaurantItem(restaurant);
    });
    
}

/* Filter restaurants */
const filterRestaurant = ()=>{
    // Get the minimum and maximum value of the filter
    let minRate = document.getElementById("minRate").value;
    let maxRate = document.getElementById("maxRate").value;
    if (minRate <= maxRate) {
        // Create the list of restaurants
        buildRestaurantList( minRate, maxRate);        
    } 
    else {
        alert('Check your rating interval.');
    }
}

/* Click on filter button to filter restaurants */
let filterBtn=document.getElementById("filter");
filterBtn.addEventListener("click",function(e){
    filterRestaurant();
    document.getElementById("review-info").style.display="none";
    $('.navbar-collapse').collapse('hide');
});


/*-----------------------------------------------------------------------------------
Add a new restaurant 
-------------------------------------------------------------------------------------*/
/* Show restaurant form */
function showRestaurantForm(long,lat){
    let formElt=document.getElementById("add-form");
    let latElt=document.getElementById("latitude");
    let longElt=document.getElementById("longitude");

    // Clear the form
    document.getElementById("new-resto").value='';
    document.getElementById("new-address").value='';   
    document.getElementById('addRestauError').style.display="none";  

    // Show the  form
    formElt.style.display="block";

    // Add long, lat as hidden variables
    longElt.value=long;
    latElt.value=lat;
}

/* Save the restaurant to the localStorage and display it in the sidebar */
function saveRestaurant (){
    // Get the user input 
    let restaurantName=document.getElementById("new-resto").value;
    let address=document.getElementById("new-address").value;    
    let lat= document.getElementById("latitude").value;
    let long=document.getElementById("longitude").value;

    // Check if the values are not null  
    if (restaurantName!=='' && address!==''){ 
        // Create a new restaurant
        let newRestaurant={
            "source":"user",
            "restaurantName":restaurantName,
            "address":address,
            "lat":lat,
            "long":long,
            "ratings":[],
            "url": "img/eat.png"
        }
        let restaurants=storage.getCollection();
        let lastId= restaurants.length + 1;
        newRestaurant.id="usr"+lastId;
        
        // Save the new restaurant in localStorage
        storage.addToLocalStorage([newRestaurant]);
        
        // Display the  new restaurant on the side bar 
        buildRestaurantItem(newRestaurant);

        // Hide the form used to add restaurant
        hideRestaurantForm();
    }
    else{
        // Display error message
        document.getElementById("addRestauError").style.display="block";
    }
}

/* Hide error message  when adding restaurant name or address*/
document.getElementById('new-resto').addEventListener("keyup",() => {
    document.getElementById('addRestauError').style.display="none";
});

document.getElementById('new-address').addEventListener("keyup",() => {
    document.getElementById('addRestauError').style.display="none";
})

/* Hide the form used to add restaurant */
function hideRestaurantForm (){
    let divElt=document.getElementById("add-form");
    divElt.style.display="none";   
}

/* Click on the map to add a  new restaurant */
function mapOnClick(){
    map.on("click",function(e){
        showRestaurantForm(e.lngLat.lng, e.lngLat.lat);
    });  
}

// Click on the add button to save the restaurant
let addBtnElt= document.getElementById("new-add");
addBtnElt.addEventListener("click",function(e){
    saveRestaurant();
});

// click on the close button to hide the form
let closeBtnElt= document.getElementById("new-close");
closeBtnElt.addEventListener("click",function(){
    hideRestaurantForm();
});

/*-----------------------------------------------------------------------------------
Start application
-------------------------------------------------------------------------------------*/
function loadData(){
    fetchRestaurant();
    fetchApi();
}

function start () {  
    initMap();    
    loadData();    
    mapOnClick();
}

start();