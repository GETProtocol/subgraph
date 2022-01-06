import { BIG_DECIMAL_ZERO, BIG_INT_ONE, V1_END_BLOCK } from "../../constants";
import {
  primarySaleMint,
  ticketInvalidated,
  ticketScanned,
  nftClaimed,
  secondarySale,
} from "../../../generated/BaseGETV1/BaseGETV1";
import {
  getProtocol,
  getRelayer,
  getProtocolDay,
  getRelayerDay,
  getEvent,
  getTicket,
  createUsageEvent,
} from "../../entities";
import { BigInt } from "@graphprotocol/graph-ts";

export function handlePrimarySaleMint(e: primarySaleMint): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);
  let event = getEvent(e.params.eventAddress.toHexString());
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);

  ticket.createTx = e.transaction.hash;
  ticket.relayer = relayer.id;
  ticket.event = event.id;
  // Early releases of the ticket-engine passed through only the primaryPrice (as denominated in local currency).
  // As such we approximate the USD basePrice of these tickets by dividing by the average <CURRENCY>/USD rate acros the
  // time period in which the v1 contracts were active.
  //
  // primaryPrice is denominated to a tenth of a cent so to avoid floating point mathematics we multiply by 100 times
  // the rate to get the price in USD to the thousandth of a cent, then divide by 1000 to get the integer cents.
  let rate = 100;
  if (event.currency == "AUD") rate = 74;
  if (event.currency == "CAD") rate = 79;
  if (event.currency == "EUR") rate = 118;
  if (event.currency == "GBP") rate = 138;
  ticket.basePrice = e.params.primaryPrice.times(BigInt.fromI32(rate)).div(BigInt.fromI32(1000));

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
  ticket.save();

  createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleTicketInvalidated(e: ticketInvalidated): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);
  let event = getEvent(ticket.event);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);

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

  createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleSecondarySale(e: secondarySale): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);
  let event = getEvent(ticket.event);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);

  protocol.resaleCount = protocol.resaleCount.plus(BIG_INT_ONE);
  protocolDay.resaleCount = protocolDay.resaleCount.plus(BIG_INT_ONE);
  relayer.resaleCount = relayer.resaleCount.plus(BIG_INT_ONE);
  relayerDay.resaleCount = relayerDay.resaleCount.plus(BIG_INT_ONE);
  event.resaleCount = event.resaleCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "RESALE", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleTicketScanned(e: ticketScanned): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);
  let event = getEvent(ticket.event);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);

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

  createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleNftClaimed(e: nftClaimed): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);
  let event = getEvent(ticket.event);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);

  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);
  relayer.claimCount = relayer.claimCount.plus(BIG_INT_ONE);
  relayerDay.claimCount = relayerDay.claimCount.plus(BIG_INT_ONE);
  event.claimCount = event.claimCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "CLAIM", e.params.orderTime, BIG_DECIMAL_ZERO);
}
