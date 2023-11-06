import { createSlice } from '@reduxjs/toolkit';

const initialState = false;

const fullscreenSlice = createSlice({
  name: 'fullscreen',
  initialState,
  reducers: {
    toggleFullscreen: (state, action) => {
      localStorage.setItem('fullscreen', action.payload);
      return action.payload;
    },
    reverseFullscreen: (state, action) => {
      localStorage.setItem('fullscreen', !state);
      return !state;
    }
  }
});

export const { toggleFullscreen, reverseFullscreen } = fullscreenSlice.actions;
export default fullscreenSlice.reducer;  // fullscreenReducer