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
const dayNightContainer = document.getElementById("day-night-container"); // Changes color based on if it's day or night

/* INITIAL STATE */

let unitInF = null; /* False indicates the tempature should be displayed in °C,
true indicates the tempature should be displayed in °F and will be the default value after the first fetch */
let weatherData = null;
let localStorageSupported = true;
const currentLocation = {
  city: "",
  state: "",
  country: "",
  cityWithinState: null,
  id: "",
};

const activeLocations = localStorage["Active locations"]
  ? JSON.parse(localStorage["Active locations"])
  : [];

function handleStateValue(obj, state) {
  if (obj.cityWithinState) {
    return `${state}, `;
  } else {
    return "";
  }
}

function updateCurrentLocationObject(
  city,
  country,
  state = "",
  cityWithinStateRes,
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
// Displays weather and handles unit conversion
function displayWeather(weather) {
  let degrees; // API call returns temperature in kelvin
  if (!unitInF) {
    toggleUnitBtn.textContent = "In fahrenheit";
    degrees = Math.round(((weather.main.temp - 273.15) * 9) / 5 + 32);
    weatherDisplayEl.textContent = `It is currently ${degrees} °F in ${weather.name}, ${weather.sys.country}`;
  } else {
    toggleUnitBtn.textContent = "In celsius";
    degrees = Math.round(weather.main.temp - 273.15);
    weatherDisplayEl.textContent = `It is currently ${degrees} °C in ${weather.name}, ${weather.sys.country}`;
  }
}

async function getCoords(city, country, state) {
  await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},${country}&appid=f604db20a39eb25fb77c35625cd7a41c`,
  )
    .then((res) => {
      return res.json();
    })
    .then((location) => {
      return { lat: location[0].lat, lon: location[0].lon };
    })
    .catch((err) => {
      console.error(err);
    });
}

async function handleState(city, country, state) {
  if (state !== "") {
    // Checks if there is a city present within that state
    let res = getCoords(city, country, state);
    if (res && res !== "N/A") {
      updateCurrentLocationObject(city, country, state, true);
      currentLocation.id = `${city}, ${handleStateValue(currentLocation, state)}${country}`;
    } else if (!res) {
      console.error(
        `There is no ${city} within ${state}. Please either enter the correct state code or don't enter a state code.`,
      );
    }
  } else {
    updateCurrentLocationObject(city, country); // No state provided
  }
}

function setURL(city, country, state) {
  if (
    currentLocation.cityWithinState ||
    currentLocation.cityWithinState !== "N/A"
  ) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},${country}&appid=f604db20a39eb25fb77c35625cd7a41c`;
  } else {
    return `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=f604db20a39eb25fb77c35625cd7a41c`;
  }
}

function toggleSaveLocationControls() {
  // Makes toggle unit and save location buttons available after inital fetch
  toggleUnitBtn.classList.remove("hidden");
  saveBtn.classList.remove("hidden");
  saveBtn.disabled = false;
}

// Fetches weather from open weather map API
async function getWeather(city, country, state) {
  handleState(city, country, state);
  const url = setURL(city, country, state);
  await fetch(url, { mode: `cors` })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      weatherData = data;
      displayWeather(weatherData);
    })
    .catch((err) => console.error(err));
  toggleSaveLocationControls();
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
  removeSavedLocationBtn.addEventListener("click", (e) => {
    const removedLocationIdx = activeLocations.findIndex(
      ({ id }) => id === e.target.parentElement.id,
    );
    activeLocations.splice(removedLocationIdx, 1);
    localStorage.setItem("Active locations", JSON.stringify(activeLocations));
    locationContainerEl.remove();
  });
}

function createLocationBtns(city, country, state, obj) {
  const savedLocationContainerEl = document.createElement("div");
  const savedLocationBtn = document.createElement("button");
  savedLocationContainerEl.id = `${city}, ${handleStateValue(obj, state)}${country}`;
  savedLocationBtn.textContent = `Fetch ${city}, ${handleStateValue(obj, state)}${country}`;
  currentLocation.id = savedLocationContainerEl.id;
  const removeSavedLocationBtn = document.createElement("button");
  removeSavedLocationBtn.textContent = "Remove location";
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

if (localStorage["Active locations"]) {
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

/* DAY/NIGHT CYCLE CONTAINER */

const time = {
  currentHours: Number(new Date().getHours()),
  currentMinutes: Number(new Date().getMinutes()),
  currentSeconds: Number(new Date().getSeconds()),
};
const dayNightState = {
  isDayTime: time.currentHours <= 18 && time.currentHours >= 6 ? true : false,
  hoursUntilSetInterval:
    time.currentHours <= 18 && time.currentHours >= 6
      ? 18 - time.currentHours
      : 30 - time.currentHours,
  minutesUntilSetInterval: 60 - time.currentMinutes,
  secondsUntilSetInterval: 60 - time.currentSeconds,
  calculateFinalMSDuration: function () {
    return (
      this.hoursUntilSetInterval * 3_600_000 +
      this.minutesUntilSetInterval * 60_000 +
      this.secondsUntilSetInterval * 1_000
    );
  },
};

function toggleClasses(el, addClass, removeClass) {
  el.classList.add(addClass);
  el.classList.remove(removeClass);
}

function toggleDayOrNight() {
  if (dayNightState.isDayTime) {
    toggleClasses(dayNightContainer, "day", "night");
  } else {
    toggleClasses(dayNightContainer, "night", "day");
  }
}

const interval = setInterval(() => {
  toggleDayOrNight();
}, dayNightState.calculateFinalMSDuration());

/* EVENT LISTENERS */

locationInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  /* TODO: Update current location object here instead of getWeather */
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
  /* TODO: handle unit conversion here instead of displayWeather */
  displayWeather(weatherData);
});

saveBtn.addEventListener("click", () => {
  // Checks if location has been added
  saveBtn.disabled = true;
  if (
    !document.getElementById(
      `${currentLocation.city}, ${handleStateValue(currentLocation, currentLocation.state)}${currentLocation.country}`,
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
  } else {
    console.warn("Location already added");
  }
});
/* TODO: have `${currentLocation.city}, ${handleStateValue(currentLocation, currentLocation.state)}${currentLocation.country}` returned from a function */
