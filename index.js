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
true indicates the tempature should be displayed in °F and will be the default value after the first fetch,
null indicates no weather data has been fetched. */
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
  switch (obj.cityWithinState) {
    case "":
    case "N/A":
      return "";
    case true:
      return `${state}, `;
  }
}

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
  currentLocation.id = `${city}, ${handleStateValue(currentLocation, state)}${country}`;
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

async function checkState(city, country, state) {
  let cityWithinState;
  if (state !== "") {
    // Checks if there is no city present within that state
    await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},${country}&appid=f604db20a39eb25fb77c35625cd7a41c`,
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
  if (
    currentLocation.cityWithinState ||
    currentLocation.cityWithinState !== "N/A"
  ) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},${country}&appid=f604db20a39eb25fb77c35625cd7a41c`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=f604db20a39eb25fb77c35625cd7a41c`;
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
    !currentLocation.cityWithinState &&
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
  removeSavedLocationBtn.addEventListener("click", (e) => {
    const removedLocationIdx = activeLocations.findIndex(
      (location) => e.parent.id,
    );
    console.log("ACTIVE LOCATIONS BEFORE MUTATION", activeLocations);
    console.log("FOUND ITEM", activeLocations[removedLocationIdx]);
    activeLocations.splice(removedLocationIdx, 1);
    console.log("ACTIVE LOCATIONS AFTER MUTATION", activeLocations);
    localStorage.setItem("Active locations", activeLocations);
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

function setDayOrNight(addClass, removeClass) {
  dayNightContainer.classList.add(addClass);
  dayNightContainer.classList.remove(removeClass);
}

function toggleDayOrNight() {
  if (dayNightState.isDayTime) {
    setDayOrNight("day", "night");
  } else {
    setDayOrNight("night", "day");
  }
}

const interval = setInterval(() => {
  toggleDayOrNight();
}, dayNightState.calculateFinalMSDuration());

/* EVENT LISTENERS */

locationInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
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
  console.log(
    `${currentLocation.city}, ${handleStateValue(state, currentLocation)}${currentLocation.country}`,
  );
  if (
    !document.getElementById(
      `${currentLocation.city}, ${handleStateValue(state, currentLocation)}${currentLocation.country}`,
    )
  ) {
    createLocationBtns(
      currentLocation.city,
      currentLocation.country,
      currentLocation.state,
      currentLocation,
    );
    // Adds to local storage
    activeLocations.push(currentLocation);
    localStorage.setItem("Active locations", JSON.stringify(activeLocations));
  } else {
    console.warn("Location already added");
  }
});
