import { createSlice } from '@reduxjs/toolkit';

const initialState = false;

const fullscreenSlice = createSlice({
  name: 'fullscreen',
  initialState,
  reducers: {
    toggleFullscreen: (state, action) => action.payload,
    reverseFullscreen: (state) => !state
  }
});

export const { toggleFullscreen, reverseFullscreen } = fullscreenSlice.actions;
export default fullscreenSlice.reducer;