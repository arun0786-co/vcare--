import { addPhoneBooking } from "./add-phone-booking";
import { addWalkIn } from "./add-walk-in";
import type { HandlerRegistry } from "./types";

export const HANDLERS: HandlerRegistry = {
  ADD_WALK_IN: addWalkIn,
  ADD_PHONE_BOOKING: addPhoneBooking,
};
