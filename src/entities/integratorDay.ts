import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { IntegratorDay } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";
import { getIntegrator } from "./integrator";

function getIntegratorDay(integratorIndex: string, day: i32): IntegratorDay {
  let id = integratorIndex.concat("-").concat(day.toString());
  let integratorDay = IntegratorDay.load(id);

  if (integratorDay == null) {
    integratorDay = new IntegratorDay(id);
    integratorDay.integrator = integratorIndex;
    integratorDay.day = day;
    integratorDay.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    integratorDay.availableFuel = BIG_DECIMAL_ZERO;
    integratorDay.reservedFuel = BIG_DECIMAL_ZERO;
    integratorDay.spentFuel = BIG_DECIMAL_ZERO;
    integratorDay.price = BIG_DECIMAL_ZERO;
    integratorDay.mintCount = BIG_INT_ZERO;
    integratorDay.invalidateCount = BIG_INT_ZERO;
    integratorDay.resaleCount = BIG_INT_ZERO;
    integratorDay.scanCount = BIG_INT_ZERO;
    integratorDay.checkInCount = BIG_INT_ZERO;
    integratorDay.claimCount = BIG_INT_ZERO;
  }

  return integratorDay as IntegratorDay;
}

export function getIntegratorDayByIndexAndEvent(integratorIndex: string, e: ethereum.Event): IntegratorDay {
  let day = e.block.timestamp.toI32() / 86400;
  return getIntegratorDay(integratorIndex, day) as IntegratorDay;
}

export function updatePrimaryMint(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  reservedFuel: BigDecimal
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  let integrator = getIntegrator(integratorIndex);
  integratorDay.mintCount = integratorDay.mintCount.plus(count);
  integratorDay.reservedFuel = integratorDay.reservedFuel.plus(reservedFuel);
  integratorDay.averageReservedPerTicket = integratorDay.reservedFuel.div(integratorDay.mintCount.toBigDecimal());
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.save();
}

export function updateSecondarySale(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  reservedFuel: BigDecimal
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  let integrator = getIntegrator(integratorIndex);
  integratorDay.resaleCount = integratorDay.resaleCount.plus(count);
  integratorDay.reservedFuel = integratorDay.reservedFuel.plus(reservedFuel);
  integratorDay.averageReservedPerTicket = integratorDay.reservedFuel.div(integratorDay.mintCount.toBigDecimal());
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.save();
}

export function updateScanned(integratorIndex: string, e: ethereum.Event, count: BigInt): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.scanCount = integratorDay.scanCount.plus(count);
  integratorDay.save();
}

export function updateCheckedIn(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  spentFuel: BigDecimal
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.checkInCount = integratorDay.checkInCount.plus(count);
  integratorDay.spentFuel = integratorDay.spentFuel.plus(spentFuel);
  integratorDay.save();
}

export function updateInvalidated(
  integratorIndex: string,
  e: ethereum.Event,
  count: BigInt,
  spentFuel: BigDecimal
): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.invalidateCount = integratorDay.invalidateCount.plus(count);
  integratorDay.spentFuel = integratorDay.spentFuel.plus(spentFuel);
  integratorDay.save();
}

export function updateClaimed(integratorIndex: string, e: ethereum.Event, count: BigInt): void {
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  integratorDay.claimCount = integratorDay.claimCount.plus(count);
  integratorDay.save();
}
