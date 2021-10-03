import { log } from "@graphprotocol/graph-ts";
import { BIG_INT_ONE, BIG_INT_TEN, NFT_ADDRESS } from "../../constants";
import {
  NFTV1 as NFTContract,
  nftClaimed,
  primarySaleMint,
  ticketInvalidated,
  ticketScanned,
} from "../../../generated/NFTV1/NFTV1";
import {
  getProtocol,
  getRelayer,
  getProtocolDay,
  getRelayerDay,
  getEventByNftIndexV1,
  createUsageEvent,
} from "../../entities";

export function handlePrimarySaleMint(e: primarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  let nftContract = NFTContract.bind(NFT_ADDRESS);
  let nftData = nftContract.try_returnStructTicket(nftIndex);

  // prices_sold[0] is apparently not a supported operation, instead .shift() to get the first item
  // basePrice is denominated to the tenth of a cent, divide by 10 to get to the cent.

  if (!nftData.reverted) {
    let basePrice = nftData.value.prices_sold.shift();
    basePrice = basePrice.div(BIG_INT_TEN);
    log.info("BasePrice: {}", [basePrice.toString()]);
  }

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);
  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocol.averageGetUsedPerMint = protocol.getUsed.toBigDecimal().div(protocol.mintCount.toBigDecimal());
  protocol.save();

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  protocolDay.averageGetUsedPerMint = protocolDay.getUsed.toBigDecimal().div(protocolDay.mintCount.toBigDecimal());
  protocolDay.save();

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);
  relayer.mintCount = relayer.mintCount.plus(BIG_INT_ONE);
  relayer.averageGetUsedPerMint = relayer.getUsed.toBigDecimal().div(relayer.mintCount.toBigDecimal());
  relayer.save();

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);
  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);
  relayerDay.averageGetUsedPerMint = relayerDay.getUsed.toBigDecimal().div(relayerDay.mintCount.toBigDecimal());
  relayerDay.save();

  if (event) {
    event.getUsed = event.getUsed.plus(e.params.getUsed);
    event.save();
  }

  createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, e.params.getUsed);
}

export function handleTicketInvalidated(e: ticketInvalidated): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);
  protocol.invalidateCount = protocol.invalidateCount.plus(BIG_INT_ONE);
  protocol.save();

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);
  protocolDay.invalidateCount = protocolDay.invalidateCount.plus(BIG_INT_ONE);
  protocolDay.save();

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);
  relayer.invalidateCount = relayer.invalidateCount.plus(BIG_INT_ONE);
  relayer.save();

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);
  relayerDay.invalidateCount = relayerDay.invalidateCount.plus(BIG_INT_ONE);
  relayerDay.save();

  if (event) {
    event.getUsed = event.getUsed.plus(e.params.getUsed);
    event.save();
  }

  createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, e.params.getUsed);
}

export function handleTicketScanned(e: ticketScanned): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);
  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);
  protocol.save();

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);
  protocolDay.save();

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);
  relayer.scanCount = relayer.scanCount.plus(BIG_INT_ONE);
  relayer.save();

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);
  relayerDay.scanCount = relayerDay.scanCount.plus(BIG_INT_ONE);
  relayerDay.save();

  if (event) {
    event.getUsed = event.getUsed.plus(e.params.getUsed);
    event.save();
  }

  createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, e.params.getUsed);
}

export function handleNftClaimed(e: nftClaimed): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV1(nftIndex);

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);
  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);
  protocol.save();

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);
  protocolDay.save();

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);
  relayer.claimCount = relayer.claimCount.plus(BIG_INT_ONE);
  relayer.save();

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);
  relayerDay.claimCount = relayerDay.claimCount.plus(BIG_INT_ONE);
  relayerDay.save();

  if (event) {
    event.getUsed = event.getUsed.plus(e.params.getUsed);
    event.save();
  }

  createUsageEvent(e, event, nftIndex, "CLAIM", e.params.orderTime, e.params.getUsed);
}
