import { addPhoneBooking } from "./add-phone-booking";
import { addWalkIn } from "./add-walk-in";
import { cancel } from "./cancel";
import { checkIn } from "./check-in";
import { completeCurrent } from "./complete-current";
import { markNoShow } from "./mark-no-show";
import { next } from "./next";
import { prioritize } from "./prioritize";
import { recheckIn } from "./recheck-in";
import type { HandlerRegistry } from "./types";

export const HANDLERS: HandlerRegistry = {
  ADD_WALK_IN: addWalkIn,
  ADD_PHONE_BOOKING: addPhoneBooking,
  CHECK_IN: checkIn,
  NEXT: next,
  COMPLETE_CURRENT: completeCurrent,
  MARK_NO_SHOW: markNoShow,
  RECHECK_IN: recheckIn,
  CANCEL: cancel,
  PRIORITIZE: prioritize,
};
