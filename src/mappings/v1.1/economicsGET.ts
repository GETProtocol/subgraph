import {
  AveragePriceUpdated,
  AverageSiloPriceUpdated,
  DepotSwiped,
  RelayerConfiguration,
  RelayerToppedUpBuffer,
} from "../../../generated/EconomicsGETV1_1/EconomicsGETV1_1";
import {
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E3,
  BIG_DECIMAL_ZERO,
  BIG_INT_ZERO,
  BYTES_EMPTY,
  RELAYER_MAPPING,
} from "../../constants";
import {
  getIntegratorByRelayerAddress,
  getIntegratorDayByIndexAndEvent,
  getProtocol,
  getProtocolDay,
  getRelayer,
  getSpentFuelRecipient,
} from "../../entities";
import { createSpentFuelCollectedEvent } from "../../entities/spentFuelCollectedEvent";
import { createTopUpEvent } from "../../entities/topUpEvent";

export function handleRelayerConfiguration(e: RelayerConfiguration): void {
  let relayerAddress = e.params.relayerAddress;

  let integratorIndex = RELAYER_MAPPING.get(relayerAddress.toHexString());
  let relayer = getRelayer(relayerAddress);
  relayer.integrator = integratorIndex.toString();

  relayer.save();
}

export function handleDepotSwiped(e: DepotSwiped): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let spentFuelRecipient = getSpentFuelRecipient(e.params.feeCollectorAddress);

  // There was a bug in very early v1.1 contracts in which the amount emitted in the event could be zero. In these
  // cases we opt to use the current spent fuel balance and assume it to be the transfer amount.
  let amount = e.params.balance.divDecimal(BIG_DECIMAL_1E18);
  if (amount.equals(BIG_DECIMAL_ZERO)) amount = protocol.currentSpentFuel;

  protocol.collectedSpentFuel = protocol.collectedSpentFuel.plus(amount);
  protocolDay.collectedSpentFuel = protocolDay.collectedSpentFuel.plus(amount);

  protocol.currentSpentFuel = protocol.currentSpentFuel.minus(amount);
  protocolDay.currentSpentFuel = protocol.currentSpentFuel;

  spentFuelRecipient.collectedSpentFuel = spentFuelRecipient.collectedSpentFuel.plus(amount);

  protocol.save();
  protocolDay.save();
  spentFuelRecipient.save();

  createSpentFuelCollectedEvent(e, spentFuelRecipient, e.params.feeCollectorAddress, amount, amount, BIG_INT_ZERO);
}

export function handleRelayerToppedUpBuffer(e: RelayerToppedUpBuffer): void {
  let relayerAddress = e.params.relayerAddress;
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  let amount = e.params.topUpAmount.divDecimal(BIG_DECIMAL_1E18);
  integrator.availableFuel = integrator.availableFuel.plus(amount);
  integratorDay.availableFuel = integrator.availableFuel;

  integrator.save();
  integratorDay.save();

  let price = e.params.priceGETTopUp.divDecimal(BIG_DECIMAL_1E3);
  createTopUpEvent(e, integrator.id, "NON_CUSTODIAL", amount, price, BYTES_EMPTY);
}

export function handleAveragePriceUpdated(e: AveragePriceUpdated): void {
  let relayerAddress = e.params.relayerUpdated;
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  integrator.price = e.params.newRelayerPrice.divDecimal(BIG_DECIMAL_1E3);
  integratorDay.price = e.params.newRelayerPrice.divDecimal(BIG_DECIMAL_1E3);

  integrator.save();
  integratorDay.save();
}

export function handleAverageSiloPriceUpdated(e: AverageSiloPriceUpdated): void {
  let relayerAddress = e.params.relayerAddress;
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  integrator.price = e.params.newPrice.divDecimal(BIG_DECIMAL_1E3);
  integratorDay.price = e.params.newPrice.divDecimal(BIG_DECIMAL_1E3);

  integrator.save();
  integratorDay.save();
}
