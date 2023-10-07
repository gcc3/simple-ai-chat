import { configureStore } from '@reduxjs/toolkit';
import fullscreenReducer from './states/fullscreenSlice';

// Redux store
const store = configureStore({
  reducer: {
    isFullscreen: fullscreenReducer
  }
});

export default store;