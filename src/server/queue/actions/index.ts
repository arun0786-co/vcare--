import { addPhoneBooking } from "./add-phone-booking";
import { addWalkIn } from "./add-walk-in";
import { checkIn } from "./check-in";
import { next } from "./next";
import type { HandlerRegistry } from "./types";

export const HANDLERS: HandlerRegistry = {
  ADD_WALK_IN: addWalkIn,
  ADD_PHONE_BOOKING: addPhoneBooking,
  CHECK_IN: checkIn,
  NEXT: next,
};
