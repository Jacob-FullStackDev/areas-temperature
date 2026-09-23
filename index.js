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
let locationLocalStorageKey = crypto.randomUUID();
const key = "f604db20a39eb25fb77c35625cd7a41c";
const currentLocation = {
  city: "",
  state: "",
  country: "",
  cityWithinState: null,
};
function updateCurrentLocationObject(city, country, state, cityWithinStateRes) {
  currentLocation.city = city;
  currentLocation.country = country;
  currentLocation.state = state;
  currentLocation.cityWithinState = cityWithinStateRes;
}

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

function createLocationBtns(city, country, state, id) {
  const savedLocationContainerEl = document.createElement("div");
  savedLocationContainerEl.id = id;
  const savedLocationBtn = document.createElement("button");
  savedLocationBtn.id = `${city}, ${true ? `${state},` : ""} ${country}`;
  savedLocationBtn.textContent = `Fetch ${city}, ${true ? `${state},` : ""} ${country}`;
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

if (localStorage.length > 0) {
  for (const key of Object.keys(localStorage)) {
    const savedLocation = JSON.parse(localStorage.getItem(key));
    const savedLocationCity = savedLocation.city;
    const savedLocationCountry = savedLocation.country;
    const savedLocationState = savedLocation.state;
    createLocationBtns(
      savedLocationCity,
      savedLocationCountry,
      savedLocationState,
      key,
    );
  }
}

// Fetches weather from open weather map api
async function checkState(city, country, state) {
  if (state !== "") {
    let cityWithinState = true;
    // Checks if there is not a city present in that state
    await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},${country}&appid=${key}`,
    )
      .then((res) => {
        return res.json();
      })
      .then((location) => {
        // if (!location[0]) {
        //   // no city matching name in state
        //   cityWithinState = false;
        // } else {
        //   cityWithinState = true;
        // }
        // cityWithinState = true;
      })
      .catch((err) => {
        console.error(err);
      });
    if (cityWithinState) {
      updateCurrentLocationObject(city, country, state, true);
    } else updateCurrentLocationObject(city, country, state, false);
  }
}
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
  // if (!cityWithinState) {
  //   console.warn(
  //     `There is no ${city} within ${state}, displaying results for the largest city named ${city} within the ${country} instead.`,
  //   );
  // }
}

locationInputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  let temporaryCity = cityInputEl.value;
  let temporaryCountry = countryInputEl.value;
  let temporaryState = stateInputEl.value;
  getWeather(temporaryCity, temporaryCountry, temporaryState);
  cityInputEl.value = "";
  countryInputEl.value = "";
  stateInputEl.value = "";
});

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

toggleUnitBtn.addEventListener("click", () => {
  unitInF = !unitInF; // Flips to opposite unit
  displayWeather(weatherData);
});

saveBtn.addEventListener("click", () => {
  // Checks if location has been added
  if (
    !document.getElementById(
      `${currentLocation.city}, ${currentLocation.cityWithinState ? `${currentLocation.state},` : ""} ${currentLocation.country}`,
    )
  ) {
    // Adds to local storage
    createLocationBtns(
      currentLocation.city,
      currentLocation.country,
      currentLocation.state,
      locationLocalStorageKey,
    );
    localStorage.setItem(
      locationLocalStorageKey,
      JSON.stringify(currentLocation),
    );
    locationLocalStorageKey = crypto.randomUUID(); // Generates new random key for localStorage
  } else {
    console.warn("Location already added");
  }
});
