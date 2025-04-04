import { Product } from "../product/types";
import { PaymentPlanType } from "@/enums/payment-plan-type.enum";
import { PaymentPlan } from "../util/types";
import { VoucherType } from "@/enums/voucher-type.enum";
import { DiscountType } from "@/enums/discount-type";
import { CartType } from "@/enums/cart-type.enum";
import { AppointmentType } from "@/enums/appointment-type.enum";
import { Operation } from "@/enums/operation-type.enum";
import { CartProduct } from "../dashboard/types";

export type InitialState = {
  loading: boolean;
  cartObject: CartObject;
  promoCodeData: PromoCodeData | null;
  paymentDetails: PaymentDetails | null;
};

export type SaveCartPayload = {
  product: string;
};

export type UsedPromoCodeDetails = {};

export type PromoCodeData = {
  hasPromoCode?: boolean;
  promoCodeError?: string;
  voucher?: {
    voucherType: VoucherType;
    discountType: DiscountType;
    discountValue: number;
    products: Product[];
    code: string;
  };
};

export type PaymentDetails = {};

export type PaymentPlanPrice = {
  paymentPlan: PaymentPlan;
  id: string;
  uniqueId: string;
  price: number;
  subscribeAndSave: number;
};

export type SubCartObject = {
  operation: Operation;
  items: CartProduct[];
  total: number;
};

export type CartObject = {
  cartType: CartType;
  cartAppointmentType: AppointmentType;
  paymentPlanType: PaymentPlanType;
  labTest: SubCartObject;
  kit: SubCartObject;
  vaccination: SubCartObject;
  medication: SubCartObject;
  consultation: SubCartObject;
};

export type PaymentPlanDropdownOption = {
  id: PaymentPlanType;
  name: string;
  label: string;
};
