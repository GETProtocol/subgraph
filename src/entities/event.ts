import { Event } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getEvent(eventAddress: string): Event {
  let event = Event.load(eventAddress);

  if (event == null) {
    event = new Event(eventAddress);
    event.integrator_address = "";
    event.fuel_used = BIG_INT_ZERO;
    event.mints = BIG_INT_ZERO;
    event.ticket_value = BIG_INT_ZERO;
  }

  return event;
}
