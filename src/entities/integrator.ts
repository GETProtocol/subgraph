import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Integrator } from "../../generated/schema";
import { ADDRESS_ZERO, BIG_DECIMAL_ZERO, BIG_INT_ZERO, RELAYER_MAPPING, TICKETEER_MAPPING } from "../constants";
import { getRelayer } from "./relayer";

export function getIntegrator(integratorIndex: string): Integrator {
  let integrator = Integrator.load(integratorIndex);

  if (integrator == null) {
    integrator = new Integrator(integratorIndex);
    integrator.averageReservedPerTicket = BIG_DECIMAL_ZERO;
    integrator.availableFuel = BIG_DECIMAL_ZERO;
    integrator.availableFuelUSD = BIG_DECIMAL_ZERO;
    integrator.reservedFuel = BIG_DECIMAL_ZERO;
    integrator.reservedFuelProtocol = BIG_DECIMAL_ZERO;
    integrator.currentReservedFuel = BIG_DECIMAL_ZERO;
    integrator.currentReservedFuelProtocol = BIG_DECIMAL_ZERO;
    integrator.spentFuel = BIG_DECIMAL_ZERO;
    integrator.spentFuelProtocol = BIG_DECIMAL_ZERO;
    integrator.price = BIG_DECIMAL_ZERO;
    integrator.activeTicketCount = 0;
    integrator.totalTopUp = BIG_INT_ZERO;
    integrator.totalTopUpUSD = BIG_DECIMAL_ZERO;
    integrator.isBillingEnabled = true;
    integrator.isConfigured = true;
    integrator.isOnCredit = false;
    integrator.isDigitalTwin = false;
    integrator.economicsAddress = ADDRESS_ZERO;
    integrator.minFeePrimary = BIG_DECIMAL_ZERO;
    integrator.maxFeePrimary = BIG_DECIMAL_ZERO;
    integrator.primaryRate = BIG_DECIMAL_ZERO;
    integrator.minFeeSecondary = BIG_DECIMAL_ZERO;
    integrator.maxFeeSecondary = BIG_DECIMAL_ZERO;
    integrator.secondaryRate = BIG_DECIMAL_ZERO;
    integrator.salesTaxRate = BIG_DECIMAL_ZERO;
    integrator.name = "";
    integrator.eventCount = BIG_INT_ZERO;
    integrator.topUpCount = BIG_INT_ZERO;
    integrator.soldCount = BIG_INT_ZERO;
    integrator.invalidatedCount = BIG_INT_ZERO;
    integrator.resoldCount = BIG_INT_ZERO;
    integrator.scannedCount = BIG_INT_ZERO;
    integrator.checkedInCount = BIG_INT_ZERO;
    integrator.claimedCount = BIG_INT_ZERO;
    integrator.treasuryRevenue = BIG_DECIMAL_ZERO;
    integrator.holdersRevenue = BIG_DECIMAL_ZERO;
  }

  return integrator as Integrator;
}

export function getIntegratorByRelayerAddress(address: Address): Integrator {
  let relayer = getRelayer(address);
  if (relayer) return getIntegrator(relayer.integrator) as Integrator;

  let integratorIndex = RELAYER_MAPPING.get(address.toHexString().toLowerCase());
  return getIntegrator(integratorIndex) as Integrator;
}

export function getIntegratorByTicketeerName(ticketeerName: string): Integrator {
  let integratorIndex = TICKETEER_MAPPING.get(ticketeerName.toLowerCase());
  return getIntegrator(integratorIndex) as Integrator;
}

export function updatePrimarySale(
  integratorIndex: string,
  count: BigInt,
  reservedFuel: BigDecimal,
  reservedFuelProtocol: BigDecimal
): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.soldCount = integrator.soldCount.plus(count);
  integrator.reservedFuel = integrator.reservedFuel.plus(reservedFuel);
  integrator.reservedFuelProtocol = integrator.reservedFuelProtocol.plus(reservedFuelProtocol);
  integrator.currentReservedFuel = integrator.currentReservedFuel.plus(reservedFuel);
  integrator.currentReservedFuelProtocol = integrator.currentReservedFuelProtocol.plus(reservedFuelProtocol);
  integrator.averageReservedPerTicket = integrator.reservedFuel.div(integrator.soldCount.toBigDecimal());
  integrator.availableFuel = integrator.availableFuel.minus(reservedFuel);
  integrator.save();
}

export function updateSecondarySale(
  integratorIndex: string,
  count: BigInt,
  reservedFuel: BigDecimal,
  reservedFuelProtocol: BigDecimal
): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.resoldCount = integrator.resoldCount.plus(count);
  integrator.reservedFuel = integrator.reservedFuel.plus(reservedFuel);
  integrator.reservedFuelProtocol = integrator.reservedFuelProtocol.plus(reservedFuelProtocol);
  integrator.currentReservedFuel = integrator.currentReservedFuel.plus(reservedFuel);
  integrator.currentReservedFuelProtocol = integrator.currentReservedFuelProtocol.plus(reservedFuelProtocol);
  integrator.averageReservedPerTicket = integrator.reservedFuel.div(integrator.soldCount.toBigDecimal());
  integrator.availableFuel = integrator.availableFuel.minus(reservedFuel);
  integrator.save();
}

export function updateScanned(integratorIndex: string, count: BigInt): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.scannedCount = integrator.scannedCount.plus(count);
  integrator.save();
}

export function updateCheckedIn(
  integratorIndex: string,
  count: BigInt,
  spentFuel: BigDecimal,
  spentFuelProtocol: BigDecimal,
  holdersRevenue: BigDecimal,
  treasuryRevenue: BigDecimal
): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.checkedInCount = integrator.checkedInCount.plus(count);
  integrator.spentFuel = integrator.spentFuel.plus(spentFuel);
  integrator.spentFuelProtocol = integrator.spentFuelProtocol.plus(spentFuelProtocol);
  integrator.holdersRevenue = integrator.holdersRevenue.plus(holdersRevenue);
  integrator.treasuryRevenue = integrator.treasuryRevenue.plus(treasuryRevenue);
  integrator.currentReservedFuel = integrator.currentReservedFuel.minus(spentFuel);
  integrator.currentReservedFuelProtocol = integrator.currentReservedFuelProtocol.minus(spentFuelProtocol);
  integrator.save();
}

export function updateInvalidated(
  integratorIndex: string,
  count: BigInt,
  spentFuel: BigDecimal,
  spentFuelProtocol: BigDecimal,
  holdersRevenue: BigDecimal,
  treasuryRevenue: BigDecimal
): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.invalidatedCount = integrator.invalidatedCount.plus(count);
  integrator.spentFuel = integrator.spentFuel.plus(spentFuel);
  integrator.spentFuelProtocol = integrator.spentFuelProtocol.plus(spentFuelProtocol);
  integrator.holdersRevenue = integrator.holdersRevenue.plus(holdersRevenue);
  integrator.treasuryRevenue = integrator.treasuryRevenue.plus(treasuryRevenue);
  integrator.currentReservedFuel = integrator.currentReservedFuel.minus(spentFuel);
  integrator.currentReservedFuelProtocol = integrator.currentReservedFuelProtocol.minus(spentFuelProtocol);
  integrator.save();
}

export function updateClaimed(integratorIndex: string, count: BigInt): void {
  let integrator = getIntegrator(integratorIndex);
  integrator.claimedCount = integrator.claimedCount.plus(count);
  integrator.save();
}
