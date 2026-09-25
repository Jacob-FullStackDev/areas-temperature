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

let unitInF; /* False indicates the tempature should be displayed in °C,
true indicates the tempature should be displayed in °F and will be the default value after the first fetch,
undefined indicates no weather data has been fetched. */
let weatherData = null;
let localStorageSupported = true;
const key = "f604db20a39eb25fb77c35625cd7a41c";
const currentLocation = {
  city: "",
  state: "",
  country: "",
  cityWithinState: null,
};
const activeLocations = []; // To ensure the saved locations are rendered in the same order upon inital page load

function updateCurrentLocationObject(
  city,
  country,
  cityWithinStateRes,
  state = "",
) {
  currentLocation.city = city;
  currentLocation.country = country;
  currentLocation.cityWithinState = cityWithinStateRes;
  currentLocation.state = state;
}

/* LOCAL STORAGE */

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
/* GET WEATHER DATA */

// Displays weather and handles tempature units
function displayWeather(weather) {
  let degrees; // API call returns temperature in kelvin
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

async function checkState(city, country, state) {
  let cityWithinState;
  if (state !== "") {
    // Checks if there is not a city present in that state
    await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},${country}&appid=${key}`,
    )
      .then((res) => {
        return res.json();
      })
      .then((location) => {
        if (!location[0]) {
          // No city matching name in state
          cityWithinState = false;
        } else {
          cityWithinState = true;
        }
      })
      .catch((err) => {
        console.error(err);
      });
    if (cityWithinState) {
      updateCurrentLocationObject(city, country, true, state);
    } else {
      updateCurrentLocationObject(city, country, false);
    }
  } else {
    updateCurrentLocationObject(city, country, "N/A"); // No state provided
  }
}

// Fetches weather from open weather map API
async function getWeather(city, country, state) {
  checkState(city, country, state);
  let url;
  if (state !== "") {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},${country}&appid=${key}`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${key}`;
  }
  await fetch(url, { mode: `cors` })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      weatherData = data;
      displayWeather(weatherData);
    })
    .catch((err) => console.error(err));
  // Makes toggle unit and save location buttons available after inital fetch
  toggleUnitBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
  if (
    !currentLocation.cityWithinState ||
    currentLocation.cityWithinState !== "N/A"
  ) {
    console.warn(
      `There is no ${city} within ${state}, displaying results for the largest city named ${city} within the ${country} instead. Saving this location will also get the temperature for the largest city.`,
    );
  }
}

/* CREATE SAVED LOCATION BUTTONS */

function utilizeLocationBtns(
  savedLocationBtn,
  removeSavedLocationBtn,
  locationContainerEl,
  city,
  country,
  state,
) {
  // Assigns event listeners to buttons
  savedLocationBtn.addEventListener("click", () => {
    getWeather(city, country, state);
  });
  removeSavedLocationBtn.addEventListener("click", () => {
    localStorage.removeItem(locationContainerEl.id);
    locationContainerEl.remove();
  });
}

function handleStateValue(obj, state) {
  switch (obj.cityWithinState) {
    case "":
    case "N/A":
      return "";
    case true:
      return `${state}, `;
  }
}

function createLocationBtns(city, country, state, obj) {
  const savedLocationContainerEl = document.createElement("div");
  const savedLocationBtn = document.createElement("button");
  savedLocationBtn.id = `${city}, ${handleStateValue(obj, state)}${country}`;
  savedLocationBtn.textContent = `Fetch ${city}, ${handleStateValue(obj, state)}${country}`;
  const removeSavedLocationBtn = document.createElement("button");
  removeSavedLocationBtn.textContent = "Delete location";
  savedLocationContainerEl.append(savedLocationBtn, removeSavedLocationBtn);
  savedLocationsEl.append(savedLocationContainerEl);
  utilizeLocationBtns(
    savedLocationBtn,
    removeSavedLocationBtn,
    savedLocationContainerEl,
    city,
    country,
    state,
  );
}

/* CREATE SAVED LOCATION BUTTONS FROM LOCALSTORAGE */
console.log(JSON.parse(localStorage["Active locations"]));
if (localStorage.length > 0) {
  for (
    let i = 0;
    i < JSON.parse(localStorage["Active locations"]).length;
    i++
  ) {
    const savedLocation = JSON.parse(localStorage["Active locations"])[i];
    const savedLocationCity = savedLocation.city;
    const savedLocationCountry = savedLocation.country;
    const savedLocationState = savedLocation.state;
    createLocationBtns(
      savedLocationCity,
      savedLocationCountry,
      savedLocationState,
      savedLocation,
    );
  }
}

/* EVENT LISTENERS */

locationInputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const temporaryCity = cityInputEl.value;
  const temporaryCountry = countryInputEl.value;
  const temporaryState = stateInputEl.value;
  getWeather(temporaryCity, temporaryCountry, temporaryState);
  cityInputEl.value = "";
  countryInputEl.value = "";
  stateInputEl.value = "";
});

toggleUnitBtn.addEventListener("click", () => {
  unitInF = !unitInF; // Flips to opposite unit
  displayWeather(weatherData);
});

saveBtn.addEventListener("click", () => {
  // Checks if location has been added
  if (
    !document.getElementById(
      `${currentLocation.city}, ${handleStateValue(state)}${currentLocation.country}`,
    )
  ) {
    createLocationBtns(
      currentLocation.city,
      currentLocation.country,
      currentLocation.state,
      currentLocation,
    );
    // Adds to local storage
    activeLocations.push({ ...currentLocation });
    localStorage.setItem("Active locations", JSON.stringify(activeLocations));
    console.log(activeLocations, localStorage);
  } else {
    console.warn("Location already added");
  }
});
