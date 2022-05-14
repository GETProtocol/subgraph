import { BIG_DECIMAL_ZERO, BIG_INT_ONE, BIG_INT_ZERO } from "../../constants";
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
  getEvent,
  getTicket,
  createUsageEvent,
  getIntegrator,
  getIntegratorDayByIndexAndEvent,
} from "../../entities";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function handlePrimarySaleMint(e: primarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(e.params.eventAddress);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);
  let relayer = getRelayer(e.transaction.from);

  ticket.createTx = e.transaction.hash;
  ticket.event = event.id;
  ticket.integrator = integrator.id;
  ticket.relayer = relayer.id;
  // Early releases of the ticket-engine passed through only the primaryPrice (as denominated in local currency).
  // As such we approximate the USD basePrice of these tickets by dividing by the average <CURRENCY>/USD rate acros the
  // time period in which the v1 contracts were active.
  //
  // primaryPrice is denominated to a tenth of a cent and multiplying this by the rate (denominated to the cent), we
  // then divide by (100*1000) to return to decimal precision).
  let rate = 100;
  if (event.currency == "AUD") rate = 74;
  if (event.currency == "CAD") rate = 79;
  if (event.currency == "EUR") rate = 118;
  if (event.currency == "GBP") rate = 138;
  ticket.basePrice = BigDecimal.fromString(e.params.primaryPrice.toString())
    .times(BigDecimal.fromString(rate.toString()))
    .div(BigDecimal.fromString("100000"));

  protocol.totalTicketValue = protocol.totalTicketValue.plus(ticket.basePrice);
  protocolDay.totalTicketValue = protocolDay.totalTicketValue.plus(ticket.basePrice);

  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  integrator.mintCount = integrator.mintCount.plus(BIG_INT_ONE);
  integratorDay.mintCount = integratorDay.mintCount.plus(BIG_INT_ONE);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleTicketInvalidated(e: ticketInvalidated): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  protocol.invalidateCount = protocol.invalidateCount.plus(BIG_INT_ONE);
  protocolDay.invalidateCount = protocolDay.invalidateCount.plus(BIG_INT_ONE);
  integrator.invalidateCount = integrator.invalidateCount.plus(BIG_INT_ONE);
  integratorDay.invalidateCount = integratorDay.invalidateCount.plus(BIG_INT_ONE);
  event.invalidateCount = event.invalidateCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleSecondarySale(e: secondarySale): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BigInt.fromI32(0), nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  protocol.totalTicketValue = protocol.totalTicketValue.plus(ticket.basePrice);
  protocolDay.totalTicketValue = protocolDay.totalTicketValue.plus(ticket.basePrice);

  protocol.resaleCount = protocol.resaleCount.plus(BIG_INT_ONE);
  protocolDay.resaleCount = protocolDay.resaleCount.plus(BIG_INT_ONE);
  integrator.resaleCount = integrator.resaleCount.plus(BIG_INT_ONE);
  integratorDay.resaleCount = integratorDay.resaleCount.plus(BIG_INT_ONE);
  event.resaleCount = event.resaleCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "RESALE", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleTicketScanned(e: ticketScanned): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);
  integrator.scanCount = integrator.scanCount.plus(BIG_INT_ONE);
  integratorDay.scanCount = integratorDay.scanCount.plus(BIG_INT_ONE);
  event.scanCount = event.scanCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleNftClaimed(e: nftClaimed): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);
  integrator.claimCount = integrator.claimCount.plus(BIG_INT_ONE);
  integratorDay.claimCount = integratorDay.claimCount.plus(BIG_INT_ONE);
  event.claimCount = event.claimCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "CLAIM", e.params.orderTime, BIG_DECIMAL_ZERO);
}
