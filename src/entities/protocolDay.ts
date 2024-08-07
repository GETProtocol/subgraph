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
    protocolDay.reservedFuelProtocol = BIG_DECIMAL_ZERO;
    protocolDay.spentFuel = BIG_DECIMAL_ZERO;
    protocolDay.spentFuelUSD = BIG_DECIMAL_ZERO;
    protocolDay.spentFuelProtocol = BIG_DECIMAL_ZERO;
    protocolDay.spentFuelProtocolUSD = BIG_DECIMAL_ZERO;
    protocolDay.currentSpentFuel = BIG_DECIMAL_ZERO;
    protocolDay.currentSpentFuelProtocol = BIG_DECIMAL_ZERO;
    protocolDay.collectedSpentFuel = BIG_DECIMAL_ZERO;
    protocolDay.collectedSpentFuelProtocol = BIG_DECIMAL_ZERO;
    protocolDay.totalSalesVolume = BIG_DECIMAL_ZERO;
    protocolDay.topUpCount = BIG_INT_ZERO;
    protocolDay.eventCount = BIG_INT_ZERO;
    protocolDay.soldCount = BIG_INT_ZERO;
    protocolDay.invalidatedCount = BIG_INT_ZERO;
    protocolDay.resoldCount = BIG_INT_ZERO;
    protocolDay.scannedCount = BIG_INT_ZERO;
    protocolDay.checkedInCount = BIG_INT_ZERO;
    protocolDay.claimedCount = BIG_INT_ZERO;
    protocolDay.treasuryRevenue = BIG_DECIMAL_ZERO;
    protocolDay.holdersRevenue = BIG_DECIMAL_ZERO;
  }

  return protocolDay as ProtocolDay;
}

export function updatePrimarySale(e: ethereum.Event, count: BigInt, reservedFuel: BigDecimal, reservedFuelProtocol: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.soldCount = protocolDay.soldCount.plus(count);
  protocolDay.reservedFuel = protocolDay.reservedFuel.plus(reservedFuel);
  protocolDay.reservedFuelProtocol = protocolDay.reservedFuelProtocol.plus(reservedFuelProtocol);
  protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.soldCount.toBigDecimal());
  protocolDay.save();
}

// specifically for the V2.1 events and upward (including v2.2 events)
export function updateFuelBalances(
  e: ethereum.Event,
  fuel: BigDecimal,
  protocolFuel: BigDecimal,
  fuelUSD: BigDecimal,
  protocolFuelUSD: BigDecimal
): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.spentFuel = protocolDay.spentFuel.plus(fuel);
  protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(protocolFuel);
  protocolDay.spentFuelUSD = protocolDay.spentFuelUSD.plus(fuelUSD);
  protocolDay.spentFuelProtocolUSD = protocolDay.spentFuelProtocolUSD.plus(protocolFuelUSD);
  protocolDay.save();
}

export function updateSecondarySale(e: ethereum.Event, count: BigInt, reservedFuel: BigDecimal, reservedFuelProtocol: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.resoldCount = protocolDay.resoldCount.plus(count);
  protocolDay.reservedFuel = protocolDay.reservedFuel.plus(reservedFuel);
  protocolDay.reservedFuelProtocol = protocolDay.reservedFuelProtocol.plus(reservedFuelProtocol);
  if (protocolDay.soldCount.gt(BIG_INT_ZERO)) {
    protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.soldCount.toBigDecimal());
  }
  protocolDay.save();
}

export function updateScanned(e: ethereum.Event, count: BigInt, spentFuel: BigDecimal, spentFuelProtocol: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  let protocol = getProtocol();
  protocolDay.scannedCount = protocolDay.scannedCount.plus(count);
  protocolDay.spentFuel = protocolDay.spentFuel.plus(spentFuel);
  protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(spentFuelProtocol);
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;
  protocolDay.currentSpentFuelProtocol = protocol.currentSpentFuelProtocol;

  protocolDay.save();
}

export function updateCheckedIn(
  e: ethereum.Event,
  count: BigInt,
  spentFuel: BigDecimal = BIG_DECIMAL_ZERO,
  spentFuelProtocol: BigDecimal = BIG_DECIMAL_ZERO,
  holdersRevenue: BigDecimal = BIG_DECIMAL_ZERO,
  treasuryRevenue: BigDecimal = BIG_DECIMAL_ZERO
): void {
  let protocolDay = getProtocolDay(e);
  let protocol = getProtocol();
  protocolDay.treasuryRevenue = protocolDay.treasuryRevenue.plus(treasuryRevenue);
  protocolDay.holdersRevenue = protocolDay.holdersRevenue.plus(holdersRevenue);
  protocolDay.checkedInCount = protocolDay.checkedInCount.plus(count);
  protocolDay.spentFuel = protocolDay.spentFuel.plus(spentFuel);
  protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(spentFuelProtocol);
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;
  protocolDay.currentSpentFuelProtocol = protocol.currentSpentFuelProtocol;
  protocolDay.save();
}

export function updateInvalidated(
  e: ethereum.Event,
  count: BigInt,
  spentFuel: BigDecimal = BIG_DECIMAL_ZERO,
  spentFuelProtocol: BigDecimal = BIG_DECIMAL_ZERO,
  holdersRevenue: BigDecimal = BIG_DECIMAL_ZERO,
  treasuryRevenue: BigDecimal = BIG_DECIMAL_ZERO
): void {
  let protocolDay = getProtocolDay(e);
  let protocol = getProtocol();
  protocolDay.treasuryRevenue = protocolDay.treasuryRevenue.plus(treasuryRevenue);
  protocolDay.holdersRevenue = protocolDay.holdersRevenue.plus(holdersRevenue);
  protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(spentFuelProtocol);
  protocolDay.spentFuel = protocolDay.spentFuel.plus(spentFuel);
  protocolDay.invalidatedCount = protocolDay.invalidatedCount.plus(count);
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;
  protocolDay.currentSpentFuelProtocol = protocol.currentSpentFuelProtocol;
  protocolDay.save();
}

export function updateClaimed(e: ethereum.Event, count: BigInt): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.claimedCount = protocolDay.claimedCount.plus(count);
  protocolDay.save();
}

export function updateTotalSalesVolume(e: ethereum.Event, price: BigDecimal): void {
  let protocolDay = getProtocolDay(e);
  protocolDay.totalSalesVolume = protocolDay.totalSalesVolume.plus(price);
  protocolDay.save();
}

export function updateFuelDistributed(
  e: ethereum.Event,
  protocolRevenue: BigDecimal,
  treasuryRevenue: BigDecimal,
  holdersRevenue: BigDecimal
): void {
  let protocolDay = getProtocolDay(e);
  let protocol = getProtocol();

  protocolDay.treasuryRevenue = protocolDay.treasuryRevenue.plus(treasuryRevenue);
  protocolDay.holdersRevenue = protocolDay.holdersRevenue.plus(holdersRevenue);

  protocolDay.spentFuel = protocolDay.spentFuel.plus(protocolRevenue.plus(holdersRevenue));
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;

  protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(protocolRevenue);
  protocolDay.currentSpentFuelProtocol = protocol.spentFuelProtocol;
  protocolDay.save();
}
