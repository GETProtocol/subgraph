import {
  AveragePriceUpdated,
  AverageSiloPriceUpdated,
  DepotSwiped,
  RelayerConfiguration,
  RelayerToppedUpBuffer,
  SiloBalanceCorrected,
} from "../../../generated/EconomicsGETV1_1/EconomicsGETV1_1";
import { BIG_DECIMAL_1E15, BIG_DECIMAL_1E18, BIG_DECIMAL_1E6, BIG_DECIMAL_ZERO, BIG_INT_ONE, RELAYER_MAPPING } from "../../constants";
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
  let relayerAddressString = relayerAddress.toHexString().toLowerCase();
  let relayer = getRelayer(relayerAddress);

  if (RELAYER_MAPPING.has(relayerAddressString)) {
    relayer.integrator = RELAYER_MAPPING.get(relayerAddressString);
  } else {
    relayer.integrator = "0";
  }

  relayer.save();
}

export function handleDepotSwiped(e: DepotSwiped): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let spentFuelRecipient = getSpentFuelRecipient(e.params.feeCollectorAddress);

  // There was a bug in very early v1.1 contracts in which the amount emitted in the event could be zero. In these
  // cases we opt to use the current spent fuel balance and assume it to be the transfer amount.
  let amount = e.params.balance.divDecimal(BIG_DECIMAL_1E15); // div by 1e18 && mul by 1e3 for GET->OPN migration
  if (amount.equals(BIG_DECIMAL_ZERO)) amount = protocol.currentSpentFuel;

  protocol.collectedSpentFuel = protocol.collectedSpentFuel.plus(amount);
  protocol.collectedSpentFuelProtocol = protocol.collectedSpentFuelProtocol.plus(amount);
  protocolDay.collectedSpentFuel = protocolDay.collectedSpentFuel.plus(amount);
  protocolDay.collectedSpentFuelProtocol = protocolDay.collectedSpentFuelProtocol.plus(amount);
  spentFuelRecipient.collectedSpentFuel = spentFuelRecipient.collectedSpentFuel.plus(amount);

  protocol.save();
  protocolDay.save();
  spentFuelRecipient.save();

  createSpentFuelCollectedEvent(e, spentFuelRecipient, e.params.feeCollectorAddress, amount, amount);
}

export function handleRelayerToppedUpBuffer(e: RelayerToppedUpBuffer): void {
  let relayerAddress = e.params.relayerAddress;

  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);

  protocol.topUpCount = protocol.topUpCount.plus(BIG_INT_ONE);
  protocolDay.topUpCount = protocolDay.topUpCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();

  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  let amount = e.params.topUpAmount.divDecimal(BIG_DECIMAL_1E15);
  let price = e.params.priceGETTopUp.divDecimal(BIG_DECIMAL_1E6);
  let topUpUSD = amount.times(price);
  let totalTopUp = integrator.totalTopUp.plus(amount);
  let totaltopUpUSD = integrator.totalTopUpUSD.plus(topUpUSD);

  integrator.availableFuel = integrator.availableFuel.plus(amount);
  integrator.availableFuelUSD = integrator.availableFuelUSD.plus(topUpUSD);
  integratorDay.availableFuel = integrator.availableFuel;
  integratorDay.availableFuelUSD = integrator.availableFuelUSD;

  integrator.price = totaltopUpUSD.div(totalTopUp);
  integratorDay.price = integrator.price;

  integrator.totalTopUp = totalTopUp;
  integrator.totalTopUpUSD = totaltopUpUSD;

  integrator.topUpCount = integrator.topUpCount.plus(BIG_INT_ONE);
  integratorDay.topUpCount = integratorDay.topUpCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();

  createTopUpEvent(e, integrator.id, amount, BIG_DECIMAL_ZERO, price);
}

export function handleAveragePriceUpdated(e: AveragePriceUpdated): void {
  let relayerAddress = e.params.relayerUpdated;
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  integrator.price = e.params.newRelayerPrice.divDecimal(BIG_DECIMAL_1E6);
  integratorDay.price = e.params.newRelayerPrice.divDecimal(BIG_DECIMAL_1E6);

  integrator.save();
  integratorDay.save();
}

export function handleAverageSiloPriceUpdated(e: AverageSiloPriceUpdated): void {
  let relayerAddress = e.params.relayerAddress;
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  integrator.price = e.params.newPrice.divDecimal(BIG_DECIMAL_1E6);
  integratorDay.price = e.params.newPrice.divDecimal(BIG_DECIMAL_1E6);

  integrator.save();
  integratorDay.save();
}

export function handleSiloBalanceCorrected(e: SiloBalanceCorrected): void {
  let relayerAddress = e.params.relayerAddress;
  let integrator = getIntegratorByRelayerAddress(relayerAddress);
  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);

  let difference = e.params.newBalance.minus(e.params.oldBalance);
  integrator.availableFuel = integrator.availableFuel.plus(difference.divDecimal(BIG_DECIMAL_1E18));
  integratorDay.availableFuel = integratorDay.availableFuel.plus(difference.divDecimal(BIG_DECIMAL_1E15));

  integrator.save();
  integratorDay.save();
}
