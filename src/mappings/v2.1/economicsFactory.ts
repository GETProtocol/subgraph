import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  EnableIntegratorBilling,
  UpdateDynamicRates,
  UpdateIntegratorOnCredit,
  IntegratorConfigured,
  IntegratorActivated,
  IntegratorDisabled,
  ConfigurationStatusUpdated,
  BillingStatusUpdated,
  DisableIntegratorBilling,
  RelayerAdded,
  IntegratorToppedUp,
  IntegratorNameSet,
  UpdateProtocolRates,
} from "../../../generated/EconomicsFactory/EconomicsFactory";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ZERO, BIG_INT_ONE } from "../../constants";
import { getIntegrator, getIntegratorDayByIndexAndEvent, getProtocol, getProtocolDay, getRelayer } from "../../entities";
import { createTopUpEvent } from "../../entities/topUpEvent";

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

export function handleSetIntegratorOnCredit(e: UpdateIntegratorOnCredit): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isOnCredit = e.params.onCredit;
  integrator.save();
}

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

export function handleIntegratorActivated(e: IntegratorActivated): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isConfigured = true;
  integrator.isBillingEnabled = true;
  integrator.save();
}

export function handleIntegratorDisabled(e: IntegratorDisabled): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isConfigured = false;
  integrator.isBillingEnabled = false;
  integrator.save();
}

export function handleConfigurationStatusUpdated(e: ConfigurationStatusUpdated): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isConfigured = e.params.status;
  integrator.save();
}

export function handleBillingStatusUpdated(e: BillingStatusUpdated): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isBillingEnabled = e.params.status;
  integrator.save();
}

export function handleDisableIntegratorBilling(e: DisableIntegratorBilling): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isBillingEnabled = false;
  integrator.save();
}

export function handleRelayerAdded(e: RelayerAdded): void {
  let relayer = getRelayer(e.params.relayerAddress);
  relayer.integrator = e.params.integratorIndex.toString();
  relayer.isEnabled = true;
  relayer.save();
}

export function handleIntegratorToppedUp(e: IntegratorToppedUp): void {
  let integratorIndex = e.params.integratorIndex.toString();
  let topUpAmount = e.params.total.divDecimal(BIG_DECIMAL_1E18);
  let price = e.params.topUpPrice.divDecimal(BIG_DECIMAL_1E18);
  let topUpAmountUSD = topUpAmount.times(price);

  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);

  protocol.topUpCount = protocol.topUpCount.plus(BIG_INT_ONE);
  protocolDay.topUpCount = protocolDay.topUpCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();

  let integrator = getIntegrator(integratorIndex);
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);
  let totalTopUp = integrator.totalTopUp.plus(topUpAmount);
  let totalTopUpUSD = integrator.totalTopUpUSD.plus(topUpAmountUSD);

  integrator.availableFuel = integrator.availableFuel.plus(topUpAmount);
  integrator.availableFuelUSD = integrator.availableFuelUSD.plus(topUpAmountUSD);
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.availableFuelUSD = integrator.availableFuelUSD;

  integrator.price = totalTopUpUSD.div(totalTopUp);
  integratorDay.price = integrator.price;

  integrator.totalTopUp = totalTopUp;
  integrator.totalTopUpUSD = totalTopUpUSD;
  integrator.price = totalTopUpUSD.div(totalTopUp);

  integrator.topUpCount = integrator.topUpCount.plus(BIG_INT_ONE);
  integratorDay.topUpCount = integratorDay.topUpCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();

  createTopUpEvent(e, integratorIndex, topUpAmount, BIG_DECIMAL_ZERO, price);
}

export function handleEnableIntegratorBilling(e: EnableIntegratorBilling): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.isBillingEnabled = true;
  integrator.save();
}

export function handleUpdateProtocolRates(e: UpdateProtocolRates): void {
  let protocol = getProtocol();
  protocol.minFeePrimary = BigInt.fromI32(e.params.protocolRates.minFeePrimary).divDecimal(BIG_DECIMAL_1E3);
  protocol.save();
}

export function handleIntegratorNameSet(e: IntegratorNameSet): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  integrator.name = e.params.name;
  integrator.save();
}
