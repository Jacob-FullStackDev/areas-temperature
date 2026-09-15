// HTML element selectors
const countryInputEl = document.getElementById("country");
const cityInputEl = document.getElementById("city");
const stateInputEl = document.getElementById("state");
const weatherDisplayEl = document.getElementById("weather-display");
const locationInputForm = document.getElementById("location-input");
const toggleUnitBtn = document.getElementById("toggle-unit-btn");
const saveBtn = document.getElementById("save-location-btn");
const savedLocationsEl = document.getElementById(
  "saved-locations-btns-container",
); // Locations container

/* INITIAL STATE */

let unitInF; /* False means the tempature will be displayed in °C true means the tempature will be displayed in °F and will be the default value after the first fetch, when empty means no weather data has been fetched. */
const key = "f604db20a39eb25fb77c35625cd7a41c";
let weatherData = null;
let degrees; // API call returns value in kelvin
let localStorageSupported = true;
let locationID = 0;
let currentCity = "";
let currentCountry = "";
let currentState = "";

function storageAvailable() {
  try {
    let storage = window["sessionStorage"];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      storage &&
      storage.length !== 0
    );
  }
}
if (!storageAvailable()) {
  localStorageSupported = false;
  console.warn(
    "Local storage is unsupported, saved locations will be cleared after you exit or refresh the page",
  );
}

function utilizeFetchBtn(
  locationEl,
  savedLocationBtn,
  removeSavedLocationBtn,
  city,
  country,
  state = undefined,
) {
  const savedLocationObj = {
    city: city,
    country: country,
  };
  savedLocationsEl.append(locationEl);
  locationID++;
  locationEl.id = `location-${locationID}`;
  localStorage.setItem(
    `location-${locationID}`,
    JSON.stringify(savedLocationObj),
  );
  savedLocationBtn.addEventListener("click", () => {
    getWeather(city, country);
  });
  removeSavedLocationBtn.addEventListener("click", () => {
    localStorage.removeItem(locationEl.id);
    locationEl.remove();
  });
}

function createFetchBtn(city, country, state = undefined) {
  const savedLocationContainerEl = document.createElement("div");
  const savedLocationBtn = document.createElement("button");
  const removeSavedLocationBtn = document.createElement("button");
  savedLocationBtn.id = `${city}, ${country}`;
  savedLocationBtn.textContent = `Fetch ${city}, ${country}`;
  removeSavedLocationBtn.textContent = "Delete location";
  savedLocationContainerEl.append(savedLocationBtn, removeSavedLocationBtn);
  savedLocationsEl.append(savedLocationContainerEl);
  utilizeFetchBtn(
    savedLocationContainerEl,
    savedLocationBtn,
    removeSavedLocationBtn,
    city,
    country,
  );
}

if (localStorage.length > 0) {
  for (let i = 1; i <= localStorage.length; i++) {
    const savedLocation = JSON.parse(localStorage.getItem(`location-${i}`));
    const savedLocationCity = savedLocation.city;
    const savedLocationCountry = savedLocation.country;
    createFetchBtn(savedLocationCity, savedLocationCountry);
  }
}

// Fetches weather from open weather map api
async function getWeather(city, country, state = "") {
  await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},${country}&appid=${key}`,
    { mode: `cors` },
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      weatherData = data;
      displayWeather(weatherData);
    })
    .catch((err) => console.error(err));
  if (state) {
    // Checks if there is not a city present in that state
    fetch(
      `http://api.openweathermap.org/geo/1.0/reverse?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${key}`,
    )
      .then((res) => {
        return res.json();
      })
      .then((location) => {
        if (
          (location[0].lat <= weatherData.lat + 0.1 ||
            location[0].lat >= weatherData.lat - 0.1) &&
          (location[0].lon <= weatherData.lon + 0.1 ||
            location[0].lon >= weatherData.lon - 0.1)
        ) {
        } else {
          // no city matching name in state
          console.warn(
            `There is no ${location[0].city} within ${location[0].state}, displaying results for the largest city named ${location[0].city} within ${location[0].country} instead.`,
          );
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  // Makes toggle unit and save location buttons available after inital fetch
  toggleUnitBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
}
locationInputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentCity = cityInputEl.value;
  currentCountry = countryInputEl.value;
  if (state) {
    currentState = stateInputEl.value;
  }
  getWeather(currentCity, currentCountry, currentState);
  cityInputEl.value = "";
  countryInputEl.value = "";
  stateInputEl.value = "";
});
// Displays weather and handles tempature units
function displayWeather(weather) {
  if (!unitInF) {
    toggleUnitBtn.textContent = "In fahrenheit";
    degrees = Math.round(((weather.main.temp - 273.15) * 9) / 5 + 32);
    weatherDisplayEl.textContent = `It is currently ${degrees} °F in ${weather.name}, ${weather.sys.country}`;
  } else if (unitInF) {
    toggleUnitBtn.textContent = "In celsius";
    degrees = Math.round(weather.main.temp - 273.15);
    weatherDisplayEl.textContent = `It is currently ${degrees} °C in ${weather.name}, ${weather.sys.country}`;
  }
}

toggleUnitBtn.addEventListener("click", () => {
  unitInF = !unitInF; // Flips to opposite unit
  displayWeather(weatherData);
});

saveBtn.addEventListener("click", () => {
  if (!document.getElementById(`${currentCity}, ${currentCountry}`)) {
    // Checks if location has been added
    createFetchBtn(currentCity, currentCountry);
  } else {
    console.warn("Location already added");
  }
});
