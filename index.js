// HTML element selectors
const countryInput = document.getElementById("country");
const cityInput = document.getElementById("city");
const weatherDisplay = document.getElementById("weather-display");
const locationInputForm = document.getElementById("location-input");
const toggleUnitBtn = document.getElementById("toggle-unit-btn");
const saveBtn = document.getElementById("save-location-btn");
const savedLocations = document.getElementById(
  "saved-locations-btns-container",
); // Locations container
// Initial state
let unitInF; /* False means the tempature will be displayed in °C true means the tempature will be displayed in °F and will be the default value after the first fetch, when empty means no weather data has been fetched. */
const key = "f604db20a39eb25fb77c35625cd7a41c";
let data = null; // Weather data
let degrees; // Api call returns value in kelvin

// Fetches weather from open weather map api
function getWeather(city, country) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${key}`,
    { mode: `cors` },
  )
    .then((response) => {
      return response.json();
    })
    .then((weather) => {
      displayWeather(weather);
      data = weather;
    })
    .catch((err) => console.error(err));
  // Makes toggle unit and save location buttons available after inital fetch
  toggleUnitBtn.style.display = "inline";
  saveBtn.style.display = "inline";
}
locationInputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  getWeather(cityInput.value, countryInput.value);
  cityInput.value = "";
  countryInput.value = "";
});
// Displays weather and handles tempature units
function displayWeather(weather) {
  if (!unitInF) {
    toggleUnitBtn.textContent = "In fahrenheit";
    degrees = Math.round(((weather.main.temp - 273.15) * 9) / 5 + 32);
    weatherDisplay.textContent = `It is currently ${degrees} °F in ${weather.name}, ${weather.sys.country}`;
  } else if (unitInF === true) {
    toggleUnitBtn.textContent = "In celsius";
    degrees = Math.round(weather.main.temp - 273.15);
    weatherDisplay.textContent = `It is currently ${degrees} °C in ${weather.name}, ${weather.sys.country}`;
  }
}
toggleUnitBtn.addEventListener("click", (event) => {
  event.preventDefault();
  unitInF = !unitInF; // Flips to opposite unit
  displayWeather(data);
});
saveBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const locationID = `${data.name}, ${data.sys.country}`;
  if (!document.getElementById(locationID)) {
    // Checks if location has been added
    const savedLocationContainerEl = document.createElement("div");
    const savedLocationBtn = document.createElement("button");
    const removeSavedLocationBtn = document.createElement("button");
    savedLocationBtn.id = `${data.name}, ${data.sys.country}`;
    savedLocationBtn.textContent = `Fetch ${data.name}, ${data.sys.country}`;
    removeSavedLocationBtn.textContent = "Delete location";
    savedLocationContainerEl.append(savedLocationBtn, removeSavedLocationBtn);
    const cityValue = data.name; // City used for fetching via clicking saved location button
    const countryValue = data.sys.country;
    savedLocationBtn.addEventListener("click", (event) => {
      event.preventDefault();
      getWeather(cityValue, countryValue);
    });
    savedLocations.append(savedLocationContainerEl);
  } else {
    console.log("Location already added");
  }
});
