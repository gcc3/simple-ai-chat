import { createSlice } from '@reduxjs/toolkit';

const initialState = "off";

const fullscreenSlice = createSlice({
  name: 'fullscreen',
  initialState,
  reducers: {
    toggleFullscreen: (state, action) => {
      return action.payload;
    }
  }
});

export const { toggleFullscreen } = fullscreenSlice.actions;
export default fullscreenSlice.reducer;  // fullscreenReducer