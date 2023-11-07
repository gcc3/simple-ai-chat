import { configureStore } from '@reduxjs/toolkit';
import fullscreenReducer from './states/fullscreenSlice';
import enterReducer from './states/enterSlice';

// Redux store
// redux-thunk is already set up by default with Redux Toolkit
const store = configureStore({
  reducer: {
    fullscreen: fullscreenReducer,
    enter: enterReducer
  }
});

export default store;