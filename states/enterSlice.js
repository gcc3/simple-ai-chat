import { createSlice } from '@reduxjs/toolkit';

const initialState = "enter";

const enterSlice = createSlice({
  name: 'enter',
  initialState,
  reducers: {
    toggleEnterChange: (state, action) => {
      return action.payload;
    }
  }
});

export const { toggleEnterChange } = enterSlice.actions;
export default enterSlice.reducer;  // enterReducer