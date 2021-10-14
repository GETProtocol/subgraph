import { log } from "@graphprotocol/graph-ts";
import { BIG_INT_ONE, BIG_INT_TEN, NFT_ADDRESS_V1, V1_END_BLOCK } from "../../constants";
import {
  BaseGETV1 as BaseGETContract,
  primarySaleMint,
  ticketInvalidated,
  ticketScanned,
  nftClaimed,
} from "../../../generated/BaseGETV1/BaseGETV1";
import { getProtocol, getRelayer, getProtocolDay, getRelayerDay, getEvent, getEventByNftIndexV1, createUsageEvent } from "../../entities";

export function handlePrimarySaleMint(e: primarySaleMint): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEvent(e.params.eventAddress.toHexString());

  let baseGETContract = BaseGETContract.bind(NFT_ADDRESS_V1);
  let nftData = baseGETContract.try_returnStructTicket(nftIndex);

  // Here, `.reverted` is not a reference to a blockchain transaction revert, rather this represents
  // the `_try` function above failing. When this errors a reverted key is added to the return object.
  // See: https://thegraph.com/docs/developer/assemblyscript-api#handling-reverted-calls
  if (!nftData.reverted) {
    // prices_sold[0] is apparently not a supported operation, instead .shift() to get the first item
    // basePrice is denominated to the tenth of a cent, divide by 10 to get to the cent.
    let basePrice = nftData.value.prices_sold.shift();
    basePrice = basePrice.div(BIG_INT_TEN);
    log.info("BasePrice: {}", [basePrice.toString()]);
  }

  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  relayer.mintCount = relayer.mintCount.plus(BIG_INT_ONE);
  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, e.params.getUsed);
}

export function handleTicketInvalidated(e: ticketInvalidated): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  protocol.invalidateCount = protocol.invalidateCount.plus(BIG_INT_ONE);
  protocolDay.invalidateCount = protocolDay.invalidateCount.plus(BIG_INT_ONE);
  relayer.invalidateCount = relayer.invalidateCount.plus(BIG_INT_ONE);
  relayerDay.invalidateCount = relayerDay.invalidateCount.plus(BIG_INT_ONE);
  event.invalidateCount = event.invalidateCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, e.params.getUsed);
}

export function handleTicketScanned(e: ticketScanned): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);
  relayer.scanCount = relayer.scanCount.plus(BIG_INT_ONE);
  relayerDay.scanCount = relayerDay.scanCount.plus(BIG_INT_ONE);
  event.scanCount = event.scanCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, e.params.getUsed);
}

export function handleNftClaimed(e: nftClaimed): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);
  relayer.claimCount = relayer.claimCount.plus(BIG_INT_ONE);
  relayerDay.claimCount = relayerDay.claimCount.plus(BIG_INT_ONE);
  event.claimCount = event.claimCount.plus(BIG_INT_ONE);

  protocolDay.save();
  protocol.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "CLAIM", e.params.orderTime, e.params.getUsed);
}
