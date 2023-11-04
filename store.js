import { configureStore } from '@reduxjs/toolkit';
import fullscreenReducer from './states/fullscreenSlice';

// Redux store
// redux-thunk is already set up by default with Redux Toolkit
const store = configureStore({
  reducer: {
    isFullscreen: fullscreenReducer
  }
});

export default store;