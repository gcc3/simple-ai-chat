import { createSlice } from '@reduxjs/toolkit';

const initialState = false;

const fullscreenSlice = createSlice({
  name: 'fullscreen',
  initialState,
  reducers: {
    toggleFullscreen: (state, action) => {
      localStorage.setItem('useFullscreen', action.payload);
      return action.payload;
    },
    reverseFullscreen: (state, action) => {
      localStorage.setItem('useFullscreen', !state);
      return !state;
    }
  }
});

export const { toggleFullscreen, reverseFullscreen } = fullscreenSlice.actions;
export default fullscreenSlice.reducer;