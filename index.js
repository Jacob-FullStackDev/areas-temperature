// html element selectors
let countryInput = document.getElementById("Country");
let cityInput = document.getElementById("City");
let weatherDisplay = document.getElementById("Weather-display");
let locationInputForm = document.getElementById("Location-input");
let toggleUnitBtn = document.getElementById("Toggle-unit-btn");
let saveBtn = document.getElementById("Save-location-btn");
let savedLocations = document.getElementById("Saved-locations-btns-container"); // locations container
// initial state
let unitInF; /* false means the tempature will be displayed in °C true means the tempature will be displayed in °F and will be the default value after the first fetch, when empty means no weather data has been fetched. */
let key = "f604db20a39eb25fb77c35625cd7a41c";
let data = null; // weather data
let degrees; // api call returns value in kelvin

// fetches weather from open weather map api
function getWeather(city, country) {
    fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${key}`,
        { mode: `cors` }
    )
        .then((response) => {
            return response.json();
        })
        .then((weather) => {
            displayWeather(weather);
            data = weather;
        })
        .catch((err) => console.error(err));
    // makes toggle unit and save location buttons available after inital fetch
    toggleUnitBtn.style.display = "inline";
    saveBtn.style.display = "inline";
}
locationInputForm.addEventListener("submit", (event) => {
    event.preventDefault();
    getWeather(cityInput.value, countryInput.value);
    cityInput.value = "";
    countryInput.value = "";
});
// displays weather and handles tempature units
function displayWeather(weather) {
    if (!unitInF) {
        toggleUnitBtn.textContent = "In fahrenheit";
        degrees = Math.round(((weather.main.temp - 273.15) * 9) / 5 + 32);
        weatherDisplay.textContent = `It is currently ${degrees} °F in ${weather.name}, ${weather.sys.country}`;
    } else if (unitInF == true) {
        toggleUnitBtn.textContent = "In celsius";
        degrees = Math.round(weather.main.temp - 273.15);
        weatherDisplay.textContent = `It is currently ${degrees} °C in ${weather.name}, ${weather.sys.country}`;
    }
}
toggleUnitBtn.addEventListener("click", (event) => {
    event.preventDefault();
    unitInF = !unitInF; // flips to opposite unit
    displayWeather(data);
});
saveBtn.addEventListener("click", (event) => {
    event.preventDefault();
    let locationID = `${data.name}, ${data.sys.country}`;
    if (!document.getElementById(locationID)) {
        // checks if location has been added
        let savedLocation = document.createElement("button");
        savedLocation.style.display = "block";
        savedLocation.id = `${data.name}, ${data.sys.country}`;
        savedLocation.textContent = `fetch ${data.name}, ${data.sys.country}`;
        let tempCity = data.name; // city used for fetching via clicking saved location button
        let tempCountry = data.sys.country;
        savedLocation.addEventListener("click", (event) => {
            event.preventDefault();
            getWeather(tempCity, tempCountry);
        });
        savedLocations.appendChild(savedLocation);
    } else {
        console.log("Location already added");
    }
});
