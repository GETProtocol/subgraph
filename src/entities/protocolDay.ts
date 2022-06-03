import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ProtocolDay } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";
import { getProtocol } from "./protocol";

export function getProtocolDay(e: ethereum.Event): ProtocolDay {
  let day = e.block.timestamp.toI32() / 86400;
  let id = day.toString();
  let protocolDay = ProtocolDay.load(id);

  if (protocolDay == null) {
    protocolDay = new ProtocolDay(id);
    protocolDay.day = day;
    protocolDay.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    protocolDay.reservedFuel = BIG_DECIMAL_ZERO;
    protocolDay.spentFuel = BIG_DECIMAL_ZERO;
    protocolDay.currentSpentFuel = BIG_DECIMAL_ZERO;
    protocolDay.collectedSpentFuel = BIG_DECIMAL_ZERO;
    protocolDay.totalTicketValue = BIG_DECIMAL_ZERO;
    protocolDay.eventCount = BIG_INT_ZERO;
    protocolDay.mintCount = BIG_INT_ZERO;
    protocolDay.invalidateCount = BIG_INT_ZERO;
    protocolDay.resaleCount = BIG_INT_ZERO;
    protocolDay.scanCount = BIG_INT_ZERO;
    protocolDay.checkInCount = BIG_INT_ZERO;
    protocolDay.claimCount = BIG_INT_ZERO;
  }

  return protocolDay as ProtocolDay;
}

export function updatePrimaryMint(e: ethereum.Event, count: BigInt, reservedFuel: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.mintCount = protocolDay.mintCount.plus(count);
  protocolDay.reservedFuel = protocolDay.reservedFuel.plus(reservedFuel);
  protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.mintCount.toBigDecimal());
  protocolDay.save();
}

export function updateSecondarySale(e: ethereum.Event, count: BigInt, reservedFuel: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.resaleCount = protocolDay.resaleCount.plus(count);
  protocolDay.reservedFuel = protocolDay.reservedFuel.plus(reservedFuel);
  protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.mintCount.toBigDecimal());
  protocolDay.save();
}

export function updateScanned(e: ethereum.Event, count: BigInt): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.scanCount = protocolDay.scanCount.plus(count);
  protocolDay.save();
}

export function updateCheckedIn(e: ethereum.Event, count: BigInt, spentFuel: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  let protocol = getProtocol();
  protocolDay.checkInCount = protocolDay.checkInCount.plus(count);
  protocolDay.spentFuel = protocolDay.spentFuel.plus(spentFuel);
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;
  protocolDay.save();
}

export function updateInvalidated(e: ethereum.Event, count: BigInt, spentFuel: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  let protocol = getProtocol();
  protocolDay.invalidateCount = protocolDay.invalidateCount.plus(count);
  protocolDay.spentFuel = protocolDay.spentFuel.plus(spentFuel);
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;
  protocolDay.save();
}

export function updateClaimed(e: ethereum.Event, count: BigInt): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.claimCount = protocolDay.claimCount.plus(count);
  protocolDay.save();
}

export function updateTotalTicketValue(e: ethereum.Event, price: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.totalTicketValue = protocolDay.totalTicketValue.plus(price);
  protocolDay.save();
}
