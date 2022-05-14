import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Event } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY } from "../constants";

export function getEvent(eventAddress: Address): Event {
  let event = Event.load(eventAddress.toHexString());

  if (event == null) {
    event = new Event(eventAddress.toHexString());
    event.eventIndex = BIG_INT_ZERO;
    event.createTx = BYTES_EMPTY;
    event.integrator = "";
    event.relayer = "";
    event.reservedFuel = BIG_DECIMAL_ZERO;
    event.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    event.mintCount = BIG_INT_ZERO;
    event.resaleCount = BIG_INT_ZERO;
    event.scanCount = BIG_INT_ZERO;
    event.checkInCount = BIG_INT_ZERO;
    event.invalidateCount = BIG_INT_ZERO;
    event.claimCount = BIG_INT_ZERO;
    event.name = "";
    event.shopUrl = "";
    event.imageUrl = "";
    event.latitude = BIG_DECIMAL_ZERO;
    event.longitude = BIG_DECIMAL_ZERO;
    event.currency = "USD";
    event.startTime = BIG_INT_ZERO;
    event.endTime = BIG_INT_ZERO;
  }

  return event as Event;
}

export function updatePrimaryMint(eventAddress: Address, count: BigInt, reservedFuel: BigDecimal): void {
  let event = getEvent(eventAddress);
  event.mintCount = event.mintCount.plus(count);
  event.reservedFuel = event.reservedFuel.plus(reservedFuel);
  event.averageReservedPerTicket = event.reservedFuel.div(event.mintCount.toBigDecimal());
  event.save();
}

export function updateSecondarySale(eventAddress: Address, count: BigInt, reservedFuel: BigDecimal): void {
  let event = getEvent(eventAddress);
  event.resaleCount = event.resaleCount.plus(count);
  event.reservedFuel = event.reservedFuel.plus(reservedFuel);
  event.averageReservedPerTicket = event.reservedFuel.div(event.mintCount.toBigDecimal());
  event.save();
}

export function updateScanned(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.scanCount = event.scanCount.plus(count);
  event.save();
}

export function updateCheckedIn(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.checkInCount = event.checkInCount.plus(count);
  event.save();
}

export function updateInvalidated(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.invalidateCount = event.invalidateCount.plus(count);
  event.save();
}

export function updateClaimed(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.claimCount = event.claimCount.plus(count);
  event.save();
}
