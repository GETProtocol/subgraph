import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Event } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY } from "../constants";
import { getIntegratorByRelayerAddress } from "./integrator";

export function getEvent(eventAddress: Address): Event {
  let event = Event.load(eventAddress.toHexString());

  if (event == null) {
    event = new Event(eventAddress.toHexString());
    event.eventIndex = BIG_INT_ZERO;
    event.createTx = BYTES_EMPTY;
    event.blockNumber = BIG_INT_ZERO;
    event.blockTimestamp = BIG_INT_ZERO;
    event.integrator = "";
    event.relayer = "";
    event.accountDeductionUsd = BIG_DECIMAL_ZERO;
    event.reservedFuel = BIG_DECIMAL_ZERO;
    event.reservedFuelProtocol = BIG_DECIMAL_ZERO;
    event.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    event.soldCount = BIG_INT_ZERO;
    event.resoldCount = BIG_INT_ZERO;
    event.scannedCount = BIG_INT_ZERO;
    event.checkedInCount = BIG_INT_ZERO;
    event.invalidatedCount = BIG_INT_ZERO;
    event.claimedCount = BIG_INT_ZERO;
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

// In early versions of the protocol some tickets were created without an event, so when the the ticket is minted it
// attempts to fetch an empty event. This has an empty integrator, instantiating an integrator with a blank ID. This
// can be avoided by defaulting the integrator to the one attached to the relayer address.
export function getEventWithFallbackIntegrator(eventAddress: Address, relayerAddress: Address): Event {
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let event = getEvent(eventAddress);
  if (event.integrator == "") {
    event.integrator = integrator.id;
    event.relayer = relayerAddress.toHexString();
  }
  return event;
}

export function updatePrimarySale(eventAddress: Address, count: BigInt, reservedFuel: BigDecimal, reservedFuelProtocol: BigDecimal): void {
  let event = getEvent(eventAddress);
  event.soldCount = event.soldCount.plus(count);
  event.reservedFuel = event.reservedFuel.plus(reservedFuel);
  event.reservedFuelProtocol = event.reservedFuelProtocol.plus(reservedFuelProtocol);
  event.averageReservedPerTicket = event.reservedFuel.div(event.soldCount.toBigDecimal());
  event.save();
}

export function updateSecondarySale(
  eventAddress: Address,
  count: BigInt,
  reservedFuel: BigDecimal,
  reservedFuelProtocol: BigDecimal
): void {
  let event = getEvent(eventAddress);
  event.resoldCount = event.resoldCount.plus(count);
  event.reservedFuel = event.reservedFuel.plus(reservedFuel);
  event.reservedFuelProtocol = event.reservedFuelProtocol.plus(reservedFuelProtocol);
  event.averageReservedPerTicket = event.reservedFuel.div(event.soldCount.toBigDecimal());
  event.save();
}

export function updateScanned(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.scannedCount = event.scannedCount.plus(count);
  event.save();
}

export function updateCheckedIn(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.checkedInCount = event.checkedInCount.plus(count);
  event.save();
}

export function updateInvalidated(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.invalidatedCount = event.invalidatedCount.plus(count);
  event.save();
}

export function updateClaimed(eventAddress: Address, count: BigInt): void {
  let event = getEvent(eventAddress);
  event.claimedCount = event.claimedCount.plus(count);
  event.save();
}

export function updateEventUSDBalance(eventAddress: Address, amount: BigDecimal): Event {
  let eventInstance = getEvent(eventAddress);
  eventInstance.accountDeductionUsd = eventInstance.accountDeductionUsd.plus(amount);
  eventInstance.save();
  return eventInstance;
}
