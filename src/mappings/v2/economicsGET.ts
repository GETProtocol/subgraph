import {
  AveragePriceUpdated,
  AverageSiloPriceUpdated,
  DepotSwiped,
  RelayerBufferMapped,
  RelayerToppedUpBuffer,
} from "../../../generated/EconomicsGETV2/EconomicsGETV2";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3 } from "../../constants";
import { getProtocol, getProtocolDay, getRelayerByAddress, getRelayerDayByAddress } from "../../entities";
import { createTopUpEvent } from "../../entities/topUpEvent";

export function handleDepotSwiped(e: DepotSwiped): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let amount = e.params.balance.divDecimal(BIG_DECIMAL_1E18);

  protocol.getMovedToFeeCollector = protocol.getMovedToFeeCollector.plus(amount);
  protocolDay.getMovedToFeeCollector = protocolDay.getMovedToFeeCollector.plus(amount);

  protocol.depotBalance = protocol.depotBalance.minus(amount);
  protocolDay.depotBalance = protocol.depotBalance;

  protocol.save();
  protocolDay.save();
}

export function handleRelayerToppedUpBuffer(e: RelayerToppedUpBuffer): void {
  let relayerAddress = e.params.relayerAddress;
  let relayer = getRelayerByAddress(relayerAddress);
  let relayerDay = getRelayerDayByAddress(relayerAddress, e);

  let amount = e.params.topUpAmount.divDecimal(BIG_DECIMAL_1E18);
  relayer.siloBalance = relayer.siloBalance.plus(amount);
  relayerDay.siloBalance = relayer.siloBalance;

  relayer.save();
  relayerDay.save();

  let price = e.params.priceGETTopUp.divDecimal(BIG_DECIMAL_1E3);
  createTopUpEvent(e, relayerAddress, amount, price);
}

export function handleAveragePriceUpdated(e: AveragePriceUpdated): void {
  let relayer = getRelayerByAddress(e.params.relayerUpdated);
  let relayerDay = getRelayerDayByAddress(e.params.relayerUpdated, e);

  relayer.basePrice = e.params.newRelayerPrice.divDecimal(BIG_DECIMAL_1E3);
  relayerDay.basePrice = e.params.newRelayerPrice.divDecimal(BIG_DECIMAL_1E3);

  relayer.save();
  relayerDay.save();
}

export function handleAverageSiloPriceUpdated(e: AverageSiloPriceUpdated): void {
  let relayer = getRelayerByAddress(e.params.relayerAddress);
  let relayerDay = getRelayerDayByAddress(e.params.relayerAddress, e);

  relayer.basePrice = e.params.newPrice.divDecimal(BIG_DECIMAL_1E3);
  relayerDay.basePrice = e.params.newPrice.divDecimal(BIG_DECIMAL_1E3);

  relayer.save();
  relayerDay.save();
}

export function handleRelayerBufferMapped(e: RelayerBufferMapped): void {
  let relayer = getRelayerByAddress(e.params.relayerAddress);

  relayer.bufferAddress = e.params.bufferAddressRelayer;

  relayer.save();
}
