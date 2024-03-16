import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { IntegratorDay } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";
import { getIntegrator } from "./integrator";

function getIntegratorDay(integratorIndex: string, day: i32): IntegratorDay {
  let id = integratorIndex.concat("-").concat(day.toString());
  let integrator = getIntegrator(integratorIndex);
  let integratorDay = IntegratorDay.load(id);

  if (integratorDay == null) {
    integratorDay = new IntegratorDay(id);
    integratorDay.integrator = integratorIndex;
    integratorDay.day = day;
    integratorDay.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    integratorDay.availableFuel = integrator.availableFuel;
    integratorDay.availableFuelUSD = BIG_DECIMAL_ZERO;
    integratorDay.reservedFuel = BIG_DECIMAL_ZERO;
    integratorDay.reservedFuelProtocol = BIG_DECIMAL_ZERO;
    integratorDay.spentFuel = BIG_DECIMAL_ZERO;
    integratorDay.spentFuelProtocol = BIG_DECIMAL_ZERO;
    integratorDay.price = integrator.price;
    integratorDay.eventCount = BIG_INT_ZERO;
    integratorDay.topUpCount = BIG_INT_ZERO;
    integratorDay.soldCount = BIG_INT_ZERO;
    integratorDay.invalidatedCount = BIG_INT_ZERO;
    integratorDay.resoldCount = BIG_INT_ZERO;
    integratorDay.scannedCount = BIG_INT_ZERO;
    integratorDay.checkedInCount = BIG_INT_ZERO;
    integratorDay.claimedCount = BIG_INT_ZERO;
    integratorDay.treasuryRevenue = BIG_DECIMAL_ZERO;
    integratorDay.holdersRevenue = BIG_DECIMAL_ZERO;
  }

  return integratorDay as IntegratorDay;
}

export function getIntegratorDayByIndexAndEvent(integratorIndex: string, e: ethereum.Event): IntegratorDay {
  let day = e.block.timestamp.toI32() / 86400;
  return getIntegratorDay(integratorIndex, day) as IntegratorDay;
}

export function updatePrimarySale(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  reservedFuel: BigDecimal,
  reservedFuelProtocol: BigDecimal
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  let integrator = getIntegrator(integratorIndex);
  integratorDay.soldCount = integratorDay.soldCount.plus(count);
  integratorDay.reservedFuel = integratorDay.reservedFuel.plus(reservedFuel);
  integratorDay.reservedFuelProtocol = integratorDay.reservedFuelProtocol.plus(reservedFuelProtocol);
  integratorDay.averageReservedPerTicket = integratorDay.reservedFuel.div(integratorDay.soldCount.toBigDecimal());
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.availableFuelUSD = integrator.availableFuelUSD;
  integratorDay.save();
}

export function updateSecondarySale(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  reservedFuel: BigDecimal,
  reservedFuelProtocol: BigDecimal
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  let integrator = getIntegrator(integratorIndex);
  integratorDay.resoldCount = integratorDay.resoldCount.plus(count);
  integratorDay.reservedFuel = integratorDay.reservedFuel.plus(reservedFuel);
  integratorDay.reservedFuelProtocol = integratorDay.reservedFuelProtocol.plus(reservedFuelProtocol);
  integratorDay.availableFuel = integrator.availableFuel;
  if (integratorDay.soldCount.gt(BIG_INT_ZERO)) {
    integratorDay.averageReservedPerTicket = integratorDay.reservedFuel.div(integratorDay.soldCount.toBigDecimal());
  }
  integratorDay.save();
}

export function updateScanned(integratorIndex: string, e: ethereum.Event, count: BigInt): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.scannedCount = integratorDay.scannedCount.plus(count);
  integratorDay.save();
}

export function updateCheckedIn(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  spentFuel: BigDecimal = BIG_DECIMAL_ZERO,
  spentFuelProtocol: BigDecimal = BIG_DECIMAL_ZERO,
  holdersRevenue: BigDecimal = BIG_DECIMAL_ZERO,
  treasuryRevenue: BigDecimal = BIG_DECIMAL_ZERO
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.checkedInCount = integratorDay.checkedInCount.plus(count);
  integratorDay.spentFuel = integratorDay.spentFuel.plus(spentFuel);
  integratorDay.spentFuelProtocol = integratorDay.spentFuelProtocol.plus(spentFuelProtocol);
  integratorDay.holdersRevenue = integratorDay.holdersRevenue.plus(holdersRevenue);
  integratorDay.treasuryRevenue = integratorDay.treasuryRevenue.plus(treasuryRevenue);
  integratorDay.save();
}

export function updateInvalidated(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  spentFuel: BigDecimal = BIG_DECIMAL_ZERO,
  spentFuelProtocol: BigDecimal = BIG_DECIMAL_ZERO,
  holdersRevenue: BigDecimal = BIG_DECIMAL_ZERO,
  treasuryRevenue: BigDecimal = BIG_DECIMAL_ZERO
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.invalidatedCount = integratorDay.invalidatedCount.plus(count);
  integratorDay.spentFuel = integratorDay.spentFuel.plus(spentFuel);
  integratorDay.spentFuelProtocol = integratorDay.spentFuelProtocol.plus(spentFuelProtocol);
  integratorDay.holdersRevenue = integratorDay.holdersRevenue.plus(holdersRevenue);
  integratorDay.treasuryRevenue = integratorDay.treasuryRevenue.plus(treasuryRevenue);
  integratorDay.save();
}

export function updateClaimed(integratorIndex: string, e: ethereum.Event, count: BigInt): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.claimedCount = integratorDay.claimedCount.plus(count);
  integratorDay.save();
}
