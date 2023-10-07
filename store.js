import { configureStore } from '@reduxjs/toolkit';
import fullscreenReducer from './state/fullscreenSlice';

const store = configureStore({
  reducer: {
    isFullscreen: fullscreenReducer
  }
});

export default store;