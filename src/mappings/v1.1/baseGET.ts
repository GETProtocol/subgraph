import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Event } from "../../../generated/schema";
import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E3,
  BIG_DECIMAL_ZERO,
  BIG_INT_ONE,
  BIG_INT_ZERO,
  CURRENCY_CONVERSION_ACTIVATED_BLOCK,
  FUEL_ACTIVATED_BLOCK,
  BASEGET_ADDRESS_V1_1,
} from "../../constants";
import {
  PrimarySaleMint,
  TicketInvalidated,
  TicketScanned,
  NftClaimed,
  CheckedIn,
  SecondarySale,
  BaseGETV1_1 as BaseGETContractV1_1,
} from "../../../generated/BaseGETV1_1/BaseGETV1_1";
import {
  getProtocol,
  getRelayer,
  getProtocolDay,
  getEvent,
  getTicket,
  createUsageEvent,
  getIntegrator,
  getIntegratorDayByIndexAndEvent,
  getEventWithFallbackIntegrator,
  getIntegratorByRelayerAddress,
} from "../../entities";

// The basePrice is always denominated in USD but the conversion did not go live for this until after the start of this
// contract. For that reason we fetch the primary price (in local currency) from the contract view function before
// making the conversion. This was only necessary for the first day of the contract launch (2020-10-20).
//
// You may also notice that these values differ slightly from those in the v1/baseGET mapping due to being able to
// select the exact date required, whereas the v1 mappings cover the period from contract start to the v1.1 release.
//
// From this point onwards all conversion will be handled by TicketEngine and all basePrice (USD) will be passed in.
function formatPrice(inputPrice: BigInt, currency: string): BigDecimal {
  let rate = 100;
  if (currency == "AUD") rate = 75;
  if (currency == "CAD") rate = 81;
  if (currency == "EUR") rate = 116;
  if (currency == "GBP") rate = 138;
  return inputPrice.toBigDecimal().times(BigDecimal.fromString(rate.toString())).div(BigDecimal.fromString("100000"));
}

export function handlePrimarySaleMint(e: PrimarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);

  // In this revision of the contracts the eventAddress was not emitted with the event meaning we need to fetch the data
  // from the node with an RPC call. Expensive to do in terms of indexing speed, can't be avoided here.
  let ticketData = BaseGETContractV1_1.bind(BASEGET_ADDRESS_V1_1).try_ticketMetadataIndex(nftIndex);
  let primaryPrice = BIG_INT_ZERO;
  let eventAddress = ADDRESS_ZERO;
  if (!ticketData.reverted) {
    primaryPrice = ticketData.value.value2[0];
    eventAddress = ticketData.value.value0;
  }

  let event = getEventWithFallbackIntegrator(eventAddress, e.transaction.from);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);
  let relayer = getRelayer(e.transaction.from);

  // Short-lived bug in v1 when tickets were created without an event existing. Here we instantiate the bare mimumum
  // data needed to not let the stats drift.
  if (Event.load(eventAddress.toHexString()) == null) {
    protocol.eventCount = protocol.eventCount.plus(BIG_INT_ONE);
    protocolDay.eventCount = protocolDay.eventCount.plus(BIG_INT_ONE);
    integrator.eventCount = integrator.eventCount.plus(BIG_INT_ONE);
    integratorDay.eventCount = integratorDay.eventCount.plus(BIG_INT_ONE);
  }

  ticket.createTx = e.transaction.hash;
  ticket.blockNumber = e.block.number;
  ticket.blockTimestamp = e.block.timestamp;
  ticket.integrator = integrator.id;
  ticket.relayer = relayer.id;
  ticket.event = event.id;
  if (e.block.number.lt(CURRENCY_CONVERSION_ACTIVATED_BLOCK)) {
    ticket.basePrice = formatPrice(primaryPrice, event.currency);
  } else {
    ticket.basePrice = primaryPrice.divDecimal(BIG_DECIMAL_1E3);
  }

  protocol.totalTicketValue = protocol.totalTicketValue.plus(ticket.basePrice);
  protocolDay.totalTicketValue = protocolDay.totalTicketValue.plus(ticket.basePrice);

  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  integrator.mintCount = integrator.mintCount.plus(BIG_INT_ONE);
  integratorDay.mintCount = integratorDay.mintCount.plus(BIG_INT_ONE);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);

    protocol.reservedFuel = protocol.reservedFuel.plus(getUsed);
    protocolDay.reservedFuel = protocolDay.reservedFuel.plus(getUsed);
    billingIntegrator.reservedFuel = billingIntegrator.reservedFuel.plus(getUsed);
    billingIntegratorDay.reservedFuel = billingIntegratorDay.reservedFuel.plus(getUsed);
    event.reservedFuel = event.reservedFuel.plus(getUsed);
    ticket.reservedFuel = ticket.reservedFuel.plus(getUsed);

    billingIntegrator.availableFuel = billingIntegrator.availableFuel.minus(getUsed);
    billingIntegratorDay.availableFuel = billingIntegrator.availableFuel;

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.plus(getUsed);

    protocol.averageReservedPerTicket = protocol.reservedFuel.div(protocol.mintCount.toBigDecimal());
    protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.mintCount.toBigDecimal());
    billingIntegrator.averageReservedPerTicket = billingIntegrator.reservedFuel.div(integrator.mintCount.toBigDecimal());
    billingIntegratorDay.averageReservedPerTicket = billingIntegratorDay.reservedFuel.div(integratorDay.mintCount.toBigDecimal());
    event.averageReservedPerTicket = event.reservedFuel.div(event.mintCount.toBigDecimal());

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, event, nftIndex, "SOLD", e.params.orderTime, ticket.basePrice, getUsed);
  }

  protocol.save();
  protocolDay.save();
  event.save();
  ticket.save();
}

export function handleTicketInvalidated(e: TicketInvalidated): void {
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

  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    // The only mechanism used in V1.1 was to fully re-allocate the ticket's 'backpack' to the DAO fee collector
    // address. Because of this we can assume the getUsed to be the full reserved fuel for that ticket.
    let getUsed = ticket.reservedFuel;

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, event, nftIndex, "INVALIDATED", e.params.orderTime, BIG_DECIMAL_ZERO, getUsed);
  }

  protocol.save();
  protocolDay.save();
}

export function handleSecondarySale(e: SecondarySale): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  let price = BIG_DECIMAL_ZERO;
  if (e.block.number.lt(CURRENCY_CONVERSION_ACTIVATED_BLOCK)) {
    price = formatPrice(e.params.resalePrice, event.currency);
  } else {
    price = e.params.resalePrice.divDecimal(BIG_DECIMAL_1E3);
  }

  protocol.totalTicketValue = protocol.totalTicketValue.plus(ticket.basePrice);
  protocolDay.totalTicketValue = protocolDay.totalTicketValue.plus(ticket.basePrice);

  protocol.resaleCount = protocol.resaleCount.plus(BIG_INT_ONE);
  protocolDay.resaleCount = protocolDay.resaleCount.plus(BIG_INT_ONE);
  integrator.resaleCount = integratorDay.resaleCount.plus(BIG_INT_ONE);
  integratorDay.resaleCount = integratorDay.resaleCount.plus(BIG_INT_ONE);
  event.resaleCount = event.resaleCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "RESOLD", e.params.orderTime, price, BIG_DECIMAL_ZERO);
}

export function handleTicketScanned(e: TicketScanned): void {
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

  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    let getUsed = ticket.reservedFuel;

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, event, nftIndex, "SCANNED", e.params.orderTime, BIG_DECIMAL_ZERO, getUsed);
  }

  protocol.save();
  protocolDay.save();
}

export function handleCheckedIn(e: CheckedIn): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  protocol.checkInCount = protocol.checkInCount.plus(BIG_INT_ONE);
  protocolDay.checkInCount = protocolDay.checkInCount.plus(BIG_INT_ONE);
  integrator.checkInCount = integrator.checkInCount.plus(BIG_INT_ONE);
  integratorDay.checkInCount = integratorDay.checkInCount.plus(BIG_INT_ONE);
  event.checkInCount = event.checkInCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    let getUsed = ticket.reservedFuel;

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, event, nftIndex, "CHECKED_IN", e.params.orderTime, BIG_DECIMAL_ZERO, getUsed);
  }

  protocol.save();
  protocolDay.save();
}

export function handleNftClaimed(e: NftClaimed): void {
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

  createUsageEvent(e, event, nftIndex, "CLAIMED", e.params.orderTime, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
}
