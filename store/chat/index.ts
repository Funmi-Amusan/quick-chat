import { createSlice } from '@reduxjs/toolkit';
import { InitialState } from './types';

export const initialchatObject = {};

const initialState: InitialState = {
  loading: false,
  chatObject: initialchatObject,
  promoCodeData: {},
  paymentDetails: null,
};

const chatSlices = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    saveUserDetails: (state, data) => {
      state.paymentDetails = data.payload;
    },
  },

  extraReducers: (builder) => { },
});

export default chatSlices.reducer;

export const { } = chatSlices.actions;
