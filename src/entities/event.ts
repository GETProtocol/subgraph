import { Event } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getEvent(eventAddress: string): Event {
  let event = Event.load(eventAddress);

  if (event == null) {
    event = new Event(eventAddress);
    event.relayer = "";
    event.getUsed = BIG_INT_ZERO;
    event.eventName = "";
    event.shopUrl = "";
    event.imageUrl = "";
    event.ticketValue = BIG_INT_ZERO;
    event.mintCount = BIG_INT_ZERO;
  }

  return event as Event;
}
