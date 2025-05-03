import pkg from '@reduxjs/toolkit';
const { createSlice } = pkg;

const initialState = "enter";

// enter key text
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