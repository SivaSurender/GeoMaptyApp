'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearButton = document.querySelector('.button-17');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  // TO KNOW THE CLICKS

  clicks = 0;
  constructor(cords, distance, duration) {
    this.cords = cords; // input as [latitude , longitude]
    this.duration = duration;
    this.distance = distance;
  }

  _setDescription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _knowClick() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(cords, distance, duration, cadence) {
    super(cords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(cords, distance, duration, elevationGain) {
    super(cords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    this.speed;
  }
}

//testing both Running and Cycling classes
const run1 = new Running([39, -12], 5.2, 24, 178);

const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

//////////////////////////////////////////////////////////////////////////////////
//App ARCHITECTURE
// let map, mapEvent;
class App {
  //setting map and mapEvent to private class
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    // Get user's position
    this._getPosition();

    // get locat storage from the staored data through setlocalstorage method

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    // toggling the action from dropdown between cycling and running
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    clearButton.addEventListener('click', this.resetLocalStorage.bind(this));
  }

  _getPosition() {
    // using  browsers inbuilt geo location APi
    // geo location api gets two callbacks one for success ad otherfor failure,
    /// initial check if the browser has gelocation api installed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Unable to get you current location');
        }
      );
    } else alert("Your device doesn't support geo positioning");
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log(`https://www.google.com/maps/@${latitude},${longitude},`);

    // lefalet stuff
    // map is the id with map from html

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    // to add marker when user clicks
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  //form change event

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // console.log(mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
    // using obj destructuring to extract latitude and longituuude of the click
  }

  // hiding form and clearing inputs
  _hideForm() {
    //empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    // helper functions

    const validInput = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    event.preventDefault();
    // console.log(event);

    // get data form
    const type = inputType.value;
    console.log(
      '🚀 ~ file: script.js ~ line 136 ~ App ~ _newWorkout ~ type',
      type
    );
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if input value is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      console.log(
        '🚀 ~ file: script.js ~ line 143 ~ App ~ _newWorkout ~ cadence',
        cadence
      );

      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers');

      // creating running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if input value is cycling, create cycling object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      console.log(
        '🚀 ~ file: script.js ~ line 155 ~ App ~ _newWorkout ~ elevation',
        elevation
      );

      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers');

      // creating cycling

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new object to workout array

    this.#workouts.push(workout);
    console.log(
      '🚀 ~ file: script.js ~ line 185 ~ App ~ _newWorkout ~ workout',
      workout
    );
    // render workout on map as marker

    this._renderWorkoutMarker(workout);

    // rendering the user entered workout in Ui as a side note
    this._renderWorkout(workout);

    // clear input fields once submitted
    //hide form
    this._hideForm();

    // setting and calling local storage
    this._setLocalStorage();

    // clearButton.addEventListener('click', this.resetLocalStorage.bind(this));
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.cords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250, //Max width of the popup, in pixels.
          minWidth: 100, //Min width of the popup, in pixels.
          autoClose: false, // false if you want to override the default behavior of the popup closing when another popup is opened.
          closeOnClick: false, //false if you want to override the default behavior of the popup closing when user clicks on the map. Defaults to the map's closePopupOnClick option.
          className: `${workout.type}-popup`, //A custom CSS class name to assign to the popup.
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
          </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(event) {
    const workoutElement = event.target.closest('.workout');

    //guard clause
    if (!workoutElement) return;

    const workout = this.#workouts.find(
      work => work.id === workoutElement.dataset.id
    );

    // console.log(workout.cords);

    this.#map.setView(workout.cords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout._knowClick();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // to remove data stored in local storage

  resetLocalStorage() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

// creating the app from blueprint

const app = new App();
