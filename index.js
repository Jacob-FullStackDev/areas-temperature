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
let cityExistsWithinState;
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
  state = "",
) {
  const savedLocationObj = {
    city: city,
    country: country,
    state: state,
  };
  savedLocationsEl.append(locationEl);
  locationID++;
  locationEl.id = `location-${locationID}`;
  localStorage.setItem(locationID, JSON.stringify(savedLocationObj));
  savedLocationBtn.addEventListener("click", () => {
    getWeather(city, country, true, state);
  });
  removeSavedLocationBtn.addEventListener("click", () => {
    locationEl.remove();
    const removedElId = Number(locationEl.id.slice(9));
    localStorage.removeItem(locationID);
    if (localStorage.length > 0) {
      Object.keys(localStorage).forEach((id) => {
        console.log(id);
        if (Number(id) > removedElId) {
          console.log(id - 1);
          localStorage.setItem(id - 1, localStorage.getItem(id));
          localStorage.removeItem(item);
        }
      });
    }
  });
}
function createFetchBtn(city, country, state = "") {
  const savedLocationContainerEl = document.createElement("div");
  const savedLocationBtn = document.createElement("button");
  const removeSavedLocationBtn = document.createElement("button");
  savedLocationBtn.id = `${city}, ${cityExistsWithinState ? `${state},` : ""} ${country}`;
  savedLocationBtn.textContent = `Fetch ${city}, ${cityExistsWithinState ? `${state},` : ""} ${country}`;
  removeSavedLocationBtn.textContent = "Delete location";
  savedLocationContainerEl.append(savedLocationBtn, removeSavedLocationBtn);
  savedLocationsEl.append(savedLocationContainerEl);
  utilizeFetchBtn(
    savedLocationContainerEl,
    savedLocationBtn,
    removeSavedLocationBtn,
    city,
    country,
    state,
  );
}

if (localStorage.length > 0) {
  for (let i = 1; i <= localStorage.length; i++) {
    const savedLocation = JSON.parse(localStorage.getItem(i));
    const savedLocationCity = savedLocation.city;
    const savedLocationCountry = savedLocation.country;
    const savedLocationState = savedLocation.state;
    createFetchBtn(savedLocationCity, savedLocationCountry, savedLocationState);
  }
}

// Fetches weather from open weather map api
async function getWeather(city, country, calledViaSavedLocationBtn, state) {
  if (state) {
    await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state ? `${state},` : ""}${country}&appid=${key}`,
    )
      .then((res) => {
        return res.json();
      })
      .then((location) => {
        if (!location[0]) {
          // no city matching name in state
          let cityExistsWithinState = false;
        } else {
          let cityExistsWithinState = true;
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city},${state ? `${state},` : ""}${country}&appid=${key}`,
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
  // Makes toggle unit and save location buttons available after inital fetch
  toggleUnitBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
  if (cityExistsWithinState === false && !calledViaSavedLocationBtn) {
    console.warn(
      `There is no ${city} within ${state}, displaying results for the largest city named ${city} within the ${country} instead.`,
    );
  }
}

locationInputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentCity = cityInputEl.value;
  currentCountry = countryInputEl.value;
  currentState = stateInputEl.value;
  getWeather(
    currentCity,
    currentCountry,
    false,
    currentState ? currentState : "",
  );
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
  // Checks if location has been added
  if (
    !document.getElementById(
      `${currentCity},${cityExistsWithinState ? `${state},` : ""}${currentCountry}`,
    )
  ) {
    createFetchBtn(
      currentCity,
      currentCountry,
      currentState ? currentState : "",
    );
  } else {
    console.warn("Location already added");
  }
});
