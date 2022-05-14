import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Protocol } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getProtocol(): Protocol {
  let id = "1";
  let protocol = Protocol.load(id);

  if (protocol == null) {
    protocol = new Protocol(id);
    protocol.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    protocol.reservedFuel = BIG_DECIMAL_ZERO;
    protocol.currentReservedFuel = BIG_DECIMAL_ZERO;
    protocol.spentFuel = BIG_DECIMAL_ZERO;
    protocol.currentSpentFuel = BIG_DECIMAL_ZERO;
    protocol.collectedSpentFuel = BIG_DECIMAL_ZERO;
    protocol.totalTicketValue = BIG_DECIMAL_ZERO;
    protocol.mintCount = BIG_INT_ZERO;
    protocol.invalidateCount = BIG_INT_ZERO;
    protocol.resaleCount = BIG_INT_ZERO;
    protocol.scanCount = BIG_INT_ZERO;
    protocol.checkInCount = BIG_INT_ZERO;
    protocol.claimCount = BIG_INT_ZERO;
  }

  return protocol as Protocol;
}

export function updatePrimaryMint(count: BigInt, reservedFuel: BigDecimal): void {
  let protocol = getProtocol();
  protocol.mintCount = protocol.mintCount.plus(count);
  protocol.reservedFuel = protocol.reservedFuel.plus(reservedFuel);
  protocol.currentReservedFuel = protocol.currentReservedFuel.plus(reservedFuel);
  protocol.averageReservedPerTicket = protocol.reservedFuel.div(protocol.mintCount.toBigDecimal());
  protocol.save();
}

export function updateSecondarySale(count: BigInt, reservedFuel: BigDecimal): void {
  let protocol = getProtocol();
  protocol.resaleCount = protocol.resaleCount.plus(count);
  protocol.reservedFuel = protocol.reservedFuel.plus(reservedFuel);
  protocol.currentReservedFuel = protocol.currentReservedFuel.plus(reservedFuel);
  protocol.averageReservedPerTicket = protocol.reservedFuel.div(protocol.mintCount.toBigDecimal());
  protocol.save();
}

export function updateScanned(count: BigInt): void {
  let protocol = getProtocol();
  protocol.scanCount = protocol.scanCount.plus(count);
  protocol.save();
}

export function updateCheckedIn(count: BigInt, spentFuel: BigDecimal): void {
  let protocol = getProtocol();
  protocol.checkInCount = protocol.checkInCount.plus(count);
  protocol.spentFuel = protocol.spentFuel.plus(spentFuel);
  protocol.currentReservedFuel = protocol.currentReservedFuel.minus(spentFuel);
  protocol.save();
}

export function updateInvalidated(count: BigInt, spentFuel: BigDecimal): void {
  let protocol = getProtocol();
  protocol.invalidateCount = protocol.invalidateCount.plus(count);
  protocol.spentFuel = protocol.spentFuel.plus(spentFuel);
  protocol.currentReservedFuel = protocol.currentReservedFuel.minus(spentFuel);
  protocol.save();
}

export function updateClaimed(count: BigInt): void {
  let protocol = getProtocol();
  protocol.claimCount = protocol.claimCount.plus(count);
  protocol.save();
}

export function updateTotalTicketValue(price: BigDecimal): void {
  let protocol = getProtocol();
  protocol.totalTicketValue = protocol.totalTicketValue.plus(price);
  protocol.save();
}
