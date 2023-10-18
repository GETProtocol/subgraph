import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  AccountBalanceCorrected,
  DisableIntegratorBilling,
  EnableIntegratorBilling,
  IntegratorConfigured,
  IntegratorDisabled,
  IntegratorToppedUp,
  RelayerAdded,
  RelayerRemoved,
  SpentFuelCollected,
  UpdateDynamicRates,
  UpdateIntegratorName,
  UpdateProtocolRates,
  UpdateIntegratorOnCredit,
} from "../../../generated/EconomicsV2/EconomicsV2";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ZERO, BIG_INT_ONE } from "../../constants";
import { getIntegrator, getIntegratorDayByIndexAndEvent, getProtocol, getProtocolDay, getRelayer } from "../../entities";
import { createTopUpEvent } from "../../entities/topUpEvent";

export function handleIntegratorConfigured(e: IntegratorConfigured): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  let relayer = getRelayer(e.params.relayerAddress);
  relayer.integrator = integrator.id;
  relayer.isEnabled = true;
  integrator.name = e.params.name;
  integrator.minFeePrimary = BigInt.fromI32(e.params.dynamicRates.minFeePrimary).divDecimal(BIG_DECIMAL_1E3);
  integrator.maxFeePrimary = BigInt.fromI32(e.params.dynamicRates.maxFeePrimary).divDecimal(BIG_DECIMAL_1E3);
  integrator.primaryRate = BigInt.fromI32(e.params.dynamicRates.primaryRate).divDecimal(BigDecimal.fromString("10000"));
  integrator.minFeeSecondary = BigInt.fromI32(e.params.dynamicRates.minFeeSecondary).divDecimal(BIG_DECIMAL_1E3);
  integrator.maxFeeSecondary = BigInt.fromI32(e.params.dynamicRates.maxFeeSecondary).divDecimal(BIG_DECIMAL_1E3);
  integrator.secondaryRate = BigInt.fromI32(e.params.dynamicRates.secondaryRate).divDecimal(BigDecimal.fromString("10000"));
  integrator.salesTaxRate = BigInt.fromI32(e.params.dynamicRates.salesTaxRate).divDecimal(BigDecimal.fromString("10000"));
  relayer.save();
  integrator.save();
}

export function handleUpdateIntegratorName(e: UpdateIntegratorName): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.name = e.params.name;
  integrator.save();
}

export function handleUpdateDynamicRates(e: UpdateDynamicRates): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.minFeePrimary = BigInt.fromI32(e.params.dynamicRates.minFeePrimary).divDecimal(BIG_DECIMAL_1E3);
  integrator.maxFeePrimary = BigInt.fromI32(e.params.dynamicRates.maxFeePrimary).divDecimal(BIG_DECIMAL_1E3);
  integrator.primaryRate = BigInt.fromI32(e.params.dynamicRates.primaryRate).divDecimal(BigDecimal.fromString("10000"));
  integrator.minFeeSecondary = BigInt.fromI32(e.params.dynamicRates.minFeeSecondary).divDecimal(BIG_DECIMAL_1E3);
  integrator.maxFeeSecondary = BigInt.fromI32(e.params.dynamicRates.maxFeeSecondary).divDecimal(BIG_DECIMAL_1E3);
  integrator.secondaryRate = BigInt.fromI32(e.params.dynamicRates.secondaryRate).divDecimal(BigDecimal.fromString("10000"));
  integrator.salesTaxRate = BigInt.fromI32(e.params.dynamicRates.salesTaxRate).divDecimal(BigDecimal.fromString("10000"));
  integrator.save();
}

export function handleUpdateProtocolRates(e: UpdateProtocolRates): void {
  let protocol = getProtocol();
  protocol.minFeePrimary = BigInt.fromI32(e.params.protocolRates.minFeePrimary).divDecimal(BIG_DECIMAL_1E3);
  protocol.save();
}

export function handleIntegratorDisabled(e: IntegratorDisabled): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isConfigured = false;
  integrator.isBillingEnabled = false;
  integrator.save();
}

export function handleRelayerAdded(e: RelayerAdded): void {
  let relayer = getRelayer(e.params.relayerAddress);
  relayer.integrator = e.params.integratorIndex.toString();
  relayer.isEnabled = true;
  relayer.save();
}

export function handleRelayerRemoved(e: RelayerRemoved): void {
  let relayer = getRelayer(e.params.relayerAddress);
  relayer.isEnabled = false;
  relayer.save();
}

export function handleEnableIntegratorBilling(e: EnableIntegratorBilling): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isBillingEnabled = true;
  integrator.save();
}

export function handleDisableIntegratorBilling(e: DisableIntegratorBilling): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isBillingEnabled = false;
  integrator.save();
}

export function handleSetIntegratorOnCredit(e: UpdateIntegratorOnCredit): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isOnCredit = e.params.onCredit;
  integrator.save();
}

export function handleIntegratorToppedUp(e: IntegratorToppedUp): void {
  let integratorIndex = e.params.integratorIndex.toString();
  let total = e.params.total.divDecimal(BIG_DECIMAL_1E18);
  let salesTax = e.params.salesTax.divDecimal(BIG_DECIMAL_1E18);
  let topUpAmount = total.minus(salesTax);
  let price = e.params.price.divDecimal(BIG_DECIMAL_1E18);
  let topUpAmountUSD = topUpAmount.times(price);
  let newAveragePrice = e.params.newAveragePrice.divDecimal(BIG_DECIMAL_1E18);

  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);

  protocol.topUpCount = protocol.topUpCount.plus(BIG_INT_ONE);
  protocolDay.topUpCount = protocolDay.topUpCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();

  let integrator = getIntegrator(integratorIndex);
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);

  integrator.availableFuel = integrator.availableFuel.plus(topUpAmount);
  integrator.availableFuelUSD = integrator.availableFuelUSD.plus(topUpAmountUSD);
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.availableFuelUSD = integrator.availableFuelUSD;

  integrator.price = newAveragePrice;
  integratorDay.price = integrator.price;

  integrator.totalTopUp = integrator.totalTopUp.plus(topUpAmount);
  integrator.totalTopUpUSD = integrator.totalTopUpUSD.plus(topUpAmountUSD);

  integrator.topUpCount = integrator.topUpCount.plus(BIG_INT_ONE);
  integratorDay.topUpCount = integratorDay.topUpCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();

  createTopUpEvent(e, integratorIndex, total, salesTax, price);
}

export function handleAccountBalanceCorrected(e: AccountBalanceCorrected): void {
  let integratorIndex = e.params.integratorIndex.toString();

  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(integratorIndex);
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);

  let diffAvail = e.params.newAvailableFuel.minus(e.params.oldAvailableFuel);
  integrator.availableFuel = integrator.availableFuel.plus(diffAvail.divDecimal(BIG_DECIMAL_1E18));
  integratorDay.availableFuel = integratorDay.availableFuel.plus(diffAvail.divDecimal(BIG_DECIMAL_1E18));

  let diffReserved = e.params.newReservedBalance.minus(e.params.oldReservedBalance);
  integrator.reservedFuel = integrator.reservedFuel.plus(diffReserved.divDecimal(BIG_DECIMAL_1E18));
  integratorDay.reservedFuel = integratorDay.reservedFuel.plus(diffReserved.divDecimal(BIG_DECIMAL_1E18));
  protocol.reservedFuel = protocol.reservedFuel.plus(diffReserved.divDecimal(BIG_DECIMAL_1E18));
  protocolDay.reservedFuel = protocolDay.reservedFuel.plus(diffReserved.divDecimal(BIG_DECIMAL_1E18));

  let diffReservedProtocol = e.params.newReservedBalanceProtocol.minus(e.params.oldReservedBalanceProtocol);
  integrator.reservedFuelProtocol = integrator.reservedFuelProtocol.plus(diffReservedProtocol.divDecimal(BIG_DECIMAL_1E18));
  integratorDay.reservedFuelProtocol = integratorDay.reservedFuelProtocol.plus(diffReservedProtocol.divDecimal(BIG_DECIMAL_1E18));
  protocol.reservedFuelProtocol = protocol.reservedFuelProtocol.plus(diffReserved.divDecimal(BIG_DECIMAL_1E18));
  protocolDay.reservedFuelProtocol = protocolDay.reservedFuelProtocol.plus(diffReserved.divDecimal(BIG_DECIMAL_1E18));

  integrator.save();
  integratorDay.save();
}

export function handleSpentFuelCollected(e: SpentFuelCollected): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let spentFuel = e.params.spentFuel;

  protocol.currentSpentFuel = BIG_DECIMAL_ZERO;
  protocol.currentSpentFuelProtocol = BIG_DECIMAL_ZERO;
  protocol.collectedSpentFuel = protocol.collectedSpentFuel.plus(spentFuel.total.divDecimal(BIG_DECIMAL_1E18));
  protocol.collectedSpentFuelProtocol = protocol.collectedSpentFuelProtocol.plus(spentFuel.protocol.divDecimal(BIG_DECIMAL_1E18));

  protocolDay.currentSpentFuel = BIG_DECIMAL_ZERO;
  protocolDay.currentSpentFuelProtocol = BIG_DECIMAL_ZERO;
  protocolDay.collectedSpentFuel = protocolDay.collectedSpentFuel.plus(spentFuel.total.divDecimal(BIG_DECIMAL_1E18));
  protocolDay.collectedSpentFuelProtocol = protocolDay.collectedSpentFuelProtocol.plus(spentFuel.protocol.divDecimal(BIG_DECIMAL_1E18));

  protocol.save();
  protocolDay.save();
}
