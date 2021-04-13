/* Create a local Storage */
function Store (){ 
    var data;   
	if (localStorage.getItem("restaurants")===null) {            
		data = {
				collection: []
        };
        localStorage.setItem("restaurants", JSON.stringify(data));			
    }
}

/* Add array of restaurants to the storage */
Store.prototype.addToLocalStorage=function(restaurantsArray){
    let data = JSON.parse(localStorage.getItem("restaurants"));
    restaurantsArray.forEach( function(restaurant){
        data.collection.push(restaurant);  
    });
    localStorage.setItem("restaurants",JSON.stringify(data));
}

/* Get the list of  stored restaurants */
Store.prototype.getCollection = function(){
    let data=JSON.parse(localStorage.getItem("restaurants")).collection;
    return data;
}

/* Update the local storage after adding a new rating object to a restaurant */
Store.prototype.update=function(data,restaurantId, newRating){
    for (let i = 0; i < data.length; i++) {
        if (data[i].id === restaurantId) {
          data[i].ratings.unshift(newRating);          
          break;
        }
      }
    localStorage.setItem("restaurants", JSON.stringify({collection:data})); 
}

/* Dop all storage and start fresh */
Store.prototype.drop = function () {
    let data = {collection: []};
    localStorage.setItem("restaurants",JSON.stringify(data));     
    
};


