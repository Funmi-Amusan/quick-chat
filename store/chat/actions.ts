import { createAsyncThunk } from "@reduxjs/toolkit";
import { cartService } from "./service";
import { SaveCartPayload } from "./types";
import { errorHandler } from "@/utils/errorHandler";

export const applyPromoCodeAction = createAsyncThunk(
  "cart/apply_voucher",
  async (promoCode: string, { rejectWithValue }) => {
    try {
      const response = await cartService.applyPromoCode(promoCode);
      if (response) {
        return { success: true, payload: response?.payload };
      }
      return response;
    } catch (error: any) {
      //toast.error("Sorry, Invalid Code Entered or does not exist");
      return rejectWithValue(error.response.data);
    }
  },
);

export const saveProductToCartAction = createAsyncThunk(
  "cart/add_product",
  async (payload: SaveCartPayload, { rejectWithValue }) => {
    try {
      const response = await cartService.saveProductToCart(payload);
      if (response) {
        return { success: true, payload: response.payload };
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const deleteProductFromCartAction = createAsyncThunk(
  "cart/delete_product",
  async (payload: SaveCartPayload, { rejectWithValue }) => {
    try {
      const response = await cartService.deleteProductFromCart(payload);
      if (response) {
        return { success: true, payload: response.payload };
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  },
);
