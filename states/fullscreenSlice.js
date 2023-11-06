import { createSlice } from '@reduxjs/toolkit';

const initialState = false;

const fullscreenSlice = createSlice({
  name: 'fullscreen',
  initialState,
  reducers: {
    toggleFullscreen: (state, action) => {
      localStorage.setItem('fullscreen', action.payload);
      return action.payload;
    }
  }
});

export const { toggleFullscreen } = fullscreenSlice.actions;
export default fullscreenSlice.reducer;  // fullscreenReducer