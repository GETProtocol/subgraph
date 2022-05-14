import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Integrator } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, RELAYER_MAPPING, TICKETEER_MAPPING } from "../constants";
import { getRelayer } from "./relayer";

export function getIntegrator(integratorIndex: string): Integrator {
  let id = integratorIndex == "" ? "0" : integratorIndex;
  let integrator = Integrator.load(id);

  if (integrator == null) {
    integrator = new Integrator(id);
    integrator.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    integrator.availableFuel = BIG_DECIMAL_ZERO;
    integrator.reservedFuel = BIG_DECIMAL_ZERO;
    integrator.currentReservedFuel = BIG_DECIMAL_ZERO;
    integrator.spentFuel = BIG_DECIMAL_ZERO;
    integrator.price = BIG_DECIMAL_ZERO;
    integrator.activeTicketCount = 0;
    integrator.isBillingEnabled = true;
    integrator.isConfigured = true;
    integrator.name = "";
    integrator.mintCount = BIG_INT_ZERO;
    integrator.invalidateCount = BIG_INT_ZERO;
    integrator.resaleCount = BIG_INT_ZERO;
    integrator.scanCount = BIG_INT_ZERO;
    integrator.checkInCount = BIG_INT_ZERO;
    integrator.claimCount = BIG_INT_ZERO;
  }

  return integrator as Integrator;
}

export function getIntegratorByRelayerAddress(address: Address): Integrator {
  let relayer = getRelayer(address);
  if (relayer) return getIntegrator(relayer.integrator) as Integrator;

  let integratorIndex = RELAYER_MAPPING.get(address.toHexString());
  return getIntegrator(integratorIndex) as Integrator;
}

export function getIntegratorByTicketeerName(ticketeerName: string): Integrator {
  let integratorIndex = TICKETEER_MAPPING.get(ticketeerName);
  return getIntegrator(integratorIndex) as Integrator;
}

export function updatePrimaryMint(integratorIndex: string, count: BigInt, reservedFuel: BigDecimal): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.mintCount = integrator.mintCount.plus(count);
  integrator.reservedFuel = integrator.reservedFuel.plus(reservedFuel);
  integrator.currentReservedFuel = integrator.currentReservedFuel.plus(reservedFuel);
  integrator.averageReservedPerTicket = integrator.reservedFuel.div(integrator.mintCount.toBigDecimal());
  integrator.availableFuel = integrator.availableFuel.minus(reservedFuel);
  integrator.save();
}

export function updateSecondarySale(integratorIndex: string, count: BigInt, reservedFuel: BigDecimal): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.resaleCount = integrator.resaleCount.plus(count);
  integrator.reservedFuel = integrator.reservedFuel.plus(reservedFuel);
  integrator.currentReservedFuel = integrator.currentReservedFuel.plus(reservedFuel);
  integrator.averageReservedPerTicket = integrator.reservedFuel.div(integrator.mintCount.toBigDecimal());
  integrator.availableFuel = integrator.availableFuel.minus(reservedFuel);
  integrator.save();
}

export function updateScanned(integratorIndex: string, count: BigInt): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.scanCount = integrator.scanCount.plus(count);
  integrator.save();
}

export function updateCheckedIn(integratorIndex: string, count: BigInt, spentFuel: BigDecimal): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.checkInCount = integrator.checkInCount.plus(count);
  integrator.spentFuel = integrator.spentFuel.plus(spentFuel);
  integrator.currentReservedFuel = integrator.currentReservedFuel.minus(spentFuel);
  integrator.save();
}

export function updateInvalidated(integratorIndex: string, count: BigInt, spentFuel: BigDecimal): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.invalidateCount = integrator.invalidateCount.plus(count);
  integrator.spentFuel = integrator.spentFuel.plus(spentFuel);
  integrator.currentReservedFuel = integrator.currentReservedFuel.minus(spentFuel);
  integrator.save();
}

export function updateClaimed(integratorIndex: string, count: BigInt): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.claimCount = integrator.claimCount.plus(count);
  integrator.save();
}
