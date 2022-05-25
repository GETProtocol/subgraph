import { BigDecimal } from "@graphprotocol/graph-ts";
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
  UpdateSpentFuelDestinations,
} from "../../../generated/EconomicsV2/EconomicsV2";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_ZERO } from "../../constants";
import { getIntegrator, getIntegratorDayByIndexAndEvent, getRelayer, getSpentFuelRecipient } from "../../entities";
import { createSpentFuelCollectedEvent } from "../../entities/spentFuelCollectedEvent";

export function handleIntegratorConfigured(e: IntegratorConfigured): void {
  let integrator = getIntegrator(e.params.integratorIndex.toString());
  let relayer = getRelayer(e.params.relayerAddress);
  relayer.integrator = integrator.id;
  relayer.isEnabled = true;
  integrator.name = e.params.name;
  relayer.save();
  integrator.save();
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

export function handleRemoved(e: RelayerRemoved): void {
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

export function handleIntegratorToppedUp(e: IntegratorToppedUp): void {
  let integratorIndex = e.params.integratorIndex.toString();
  let amount = e.params.amount.divDecimal(BIG_DECIMAL_1E18);
  let price = e.params.newAveragePrice.divDecimal(BIG_DECIMAL_1E18);

  let integrator = getIntegrator(integratorIndex);
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);

  integrator.availableFuel = integrator.availableFuel.plus(amount);
  integrator.price = price;
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.price = integrator.price;

  integrator.save();
  integratorDay.save();
}

export function handleUpdateSpentFuelDestinations(e: UpdateSpentFuelDestinations): void {
  for (let i = 0; i < e.params.old.length; ++i) {
    let old = e.params.old[i];
    let spentFuelRecipient = getSpentFuelRecipient(old.destination);
    spentFuelRecipient.percentage = BIG_DECIMAL_ZERO;
    spentFuelRecipient.isEnabled = false;
    spentFuelRecipient.save();
  }

  for (let i = 0; i < e.params.updated.length; ++i) {
    let updated = e.params.updated[i];
    let spentFuelRecipient = getSpentFuelRecipient(updated.destination);
    spentFuelRecipient.label = updated.label;
    spentFuelRecipient.percentage = BigDecimal.fromString(updated.percentage.toString()).div(
      BigDecimal.fromString("10000") // 1e4, 1_000_000 becomes 100%
    );
    spentFuelRecipient.isEnabled = true;
    spentFuelRecipient.save();
  }
}

export function handleSpentFuelCollected(e: SpentFuelCollected): void {
  let spentFuelRecipient = getSpentFuelRecipient(e.params.destination.destination);
  let amount = e.params.amount.divDecimal(BIG_DECIMAL_1E18);
  spentFuelRecipient.collectedSpentFuel = spentFuelRecipient.collectedSpentFuel.plus(amount);
  spentFuelRecipient.save();

  createSpentFuelCollectedEvent(
    e,
    spentFuelRecipient,
    e.params.destination.destination,
    amount,
    e.params.spentFuel.divDecimal(BIG_DECIMAL_1E18),
    e.params.spentFuelTicketCount
  );
}

export function handleAccountBalanceCorrected(e: AccountBalanceCorrected): void {
  let integratorIndex = e.params.integratorIndex.toString();

  let integrator = getIntegrator(integratorIndex);
  let integratorDay = getIntegratorDayByIndexAndEvent(integratorIndex, e);

  integrator.availableFuel = e.params.newBalance.divDecimal(BIG_DECIMAL_1E18);
  integratorDay.availableFuel = e.params.newBalance.divDecimal(BIG_DECIMAL_1E18);

  integrator.save();
  integratorDay.save();
}
