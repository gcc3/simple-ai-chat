import pkg from '@reduxjs/toolkit';
const { configureStore } = pkg;

import fullscreenReducer from './states/fullscreenSlice.js';
import enterReducer from './states/enterSlice.js';

// Redux store
const store = configureStore({
  reducer: {
    fullscreen: fullscreenReducer,
    enter: enterReducer
  }
});

export default store;