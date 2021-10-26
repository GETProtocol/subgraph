import { Event } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY } from "../constants";

export function getEvent(eventAddress: string): Event {
  let event = Event.load(eventAddress);

  if (event == null) {
    event = new Event(eventAddress);
    event.createTx = BYTES_EMPTY;
    event.getDebitedFromSilo = BIG_DECIMAL_ZERO;
    event.getHeldInFuelTanks = BIG_DECIMAL_ZERO;
    event.getCreditedToDepot = BIG_DECIMAL_ZERO;
    event.averageGetPerMint = BIG_DECIMAL_ZERO;
    event.mintCount = BIG_INT_ZERO;
    event.scanCount = BIG_INT_ZERO;
    event.invalidateCount = BIG_INT_ZERO;
    event.resaleCount = BIG_INT_ZERO;
    event.checkInCount = BIG_INT_ZERO;
    event.claimCount = BIG_INT_ZERO;
    event.relayer = "";
    event.eventName = "";
    event.shopUrl = "";
    event.imageUrl = "";
    event.orderTime = BIG_INT_ZERO;
    event.latitude = BIG_DECIMAL_ZERO;
    event.longitude = BIG_DECIMAL_ZERO;
    event.currency = "USD";
    event.ticketeerName = "";
  }

  return event as Event;
}
