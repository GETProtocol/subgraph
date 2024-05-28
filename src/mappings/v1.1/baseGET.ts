import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Event } from "../../../generated/schema";
import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E3,
  BIG_DECIMAL_ZERO,
  BIG_INT_ONE,
  BIG_INT_ZERO,
  CURRENCY_CONVERSION_ACTIVATED_BLOCK,
  FUEL_ACTIVATED_BLOCK,
  BASEGET_ADDRESS_V1_1,
  BIG_DECIMAL_1E15,
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

  protocol.totalSalesVolume = protocol.totalSalesVolume.plus(ticket.basePrice);
  protocolDay.totalSalesVolume = protocolDay.totalSalesVolume.plus(ticket.basePrice);

  protocol.soldCount = protocol.soldCount.plus(BIG_INT_ONE);
  protocolDay.soldCount = protocolDay.soldCount.plus(BIG_INT_ONE);
  integrator.soldCount = integrator.soldCount.plus(BIG_INT_ONE);
  integratorDay.soldCount = integratorDay.soldCount.plus(BIG_INT_ONE);
  event.soldCount = event.soldCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E15);

    protocol.reservedFuel = protocol.reservedFuel.plus(getUsed);
    protocol.reservedFuelProtocol = protocol.reservedFuelProtocol.plus(getUsed);
    protocolDay.reservedFuel = protocolDay.reservedFuel.plus(getUsed);
    protocolDay.reservedFuelProtocol = protocolDay.reservedFuelProtocol.plus(getUsed);
    billingIntegrator.reservedFuel = billingIntegrator.reservedFuel.plus(getUsed);
    billingIntegrator.reservedFuelProtocol = billingIntegrator.reservedFuelProtocol.plus(getUsed);
    billingIntegratorDay.reservedFuel = billingIntegratorDay.reservedFuel.plus(getUsed);
    billingIntegratorDay.reservedFuelProtocol = billingIntegratorDay.reservedFuelProtocol.plus(getUsed);
    event.reservedFuel = event.reservedFuel.plus(getUsed);
    event.reservedFuelProtocol = event.reservedFuelProtocol.plus(getUsed);
    ticket.reservedFuel = ticket.reservedFuel.plus(getUsed);
    ticket.reservedFuelProtocol = ticket.reservedFuelProtocol.plus(getUsed);

    event.accountDeductionUsd = event.accountDeductionUsd.plus(getUsed.times(billingIntegrator.price));

    billingIntegrator.availableFuel = billingIntegrator.availableFuel.minus(getUsed);
    billingIntegratorDay.availableFuel = billingIntegrator.availableFuel;

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.plus(getUsed);
    billingIntegrator.currentReservedFuelProtocol = billingIntegrator.currentReservedFuelProtocol.plus(getUsed);

    protocol.averageReservedPerTicket = protocol.reservedFuel.div(protocol.soldCount.toBigDecimal());
    protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.soldCount.toBigDecimal());
    event.averageReservedPerTicket = event.reservedFuel.div(event.soldCount.toBigDecimal());

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, 0, event, nftIndex, "SOLD", e.params.orderTime, ticket.basePrice, getUsed, getUsed);
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

  ticket.isInvalidated = true;

  protocol.invalidatedCount = protocol.invalidatedCount.plus(BIG_INT_ONE);
  protocolDay.invalidatedCount = protocolDay.invalidatedCount.plus(BIG_INT_ONE);
  integrator.invalidatedCount = integrator.invalidatedCount.plus(BIG_INT_ONE);
  integratorDay.invalidatedCount = integratorDay.invalidatedCount.plus(BIG_INT_ONE);
  event.invalidatedCount = event.invalidatedCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    // The only mechanism used in V1.1 was to fully re-allocate the ticket's 'backpack' to the DAO fee collector
    // address. Because of this we can assume the getUsed to be the full reserved fuel for that ticket.
    let getUsed = ticket.reservedFuel.times(BIG_DECIMAL_1E3);

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocol.spentFuelProtocol = protocol.spentFuelProtocol.plus(getUsed);
    protocol.treasuryRevenue = protocol.treasuryRevenue.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(getUsed);
    protocolDay.treasuryRevenue = protocolDay.treasuryRevenue.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegrator.spentFuelProtocol = billingIntegrator.spentFuelProtocol.plus(getUsed);
    billingIntegrator.treasuryRevenue = billingIntegrator.treasuryRevenue.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuelProtocol = billingIntegratorDay.spentFuelProtocol.plus(getUsed);
    billingIntegratorDay.treasuryRevenue = billingIntegratorDay.treasuryRevenue.plus(getUsed);

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);
    billingIntegrator.currentReservedFuelProtocol = billingIntegrator.currentReservedFuelProtocol.minus(getUsed);

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, 0, event, nftIndex, "INVALIDATED", e.params.orderTime, BIG_DECIMAL_ZERO, getUsed, getUsed);
  }

  protocol.save();
  protocolDay.save();
}

export function handleSecondarySale(e: SecondarySale): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(ticket.event == "" ? ADDRESS_ZERO : Address.fromString(ticket.event));
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

  protocol.totalSalesVolume = protocol.totalSalesVolume.plus(ticket.basePrice);
  protocolDay.totalSalesVolume = protocolDay.totalSalesVolume.plus(ticket.basePrice);

  protocol.resoldCount = protocol.resoldCount.plus(BIG_INT_ONE);
  protocolDay.resoldCount = protocolDay.resoldCount.plus(BIG_INT_ONE);
  integrator.resoldCount = integrator.resoldCount.plus(BIG_INT_ONE);
  integratorDay.resoldCount = integratorDay.resoldCount.plus(BIG_INT_ONE);
  event.resoldCount = event.resoldCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();

  createUsageEvent(e, 0, event, nftIndex, "RESOLD", e.params.orderTime, price, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
}

export function handleTicketScanned(e: TicketScanned): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(ticket.event == "" ? ADDRESS_ZERO : Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  ticket.isScanned = true;

  protocol.scannedCount = protocol.scannedCount.plus(BIG_INT_ONE);
  protocolDay.scannedCount = protocolDay.scannedCount.plus(BIG_INT_ONE);
  integrator.scannedCount = integrator.scannedCount.plus(BIG_INT_ONE);
  integratorDay.scannedCount = integratorDay.scannedCount.plus(BIG_INT_ONE);
  event.scannedCount = event.scannedCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    let getUsed = ticket.reservedFuel.times(BIG_DECIMAL_1E3);

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocol.spentFuelProtocol = protocol.spentFuelProtocol.plus(getUsed);
    protocol.treasuryRevenue = protocol.treasuryRevenue.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(getUsed);
    protocolDay.treasuryRevenue = protocolDay.treasuryRevenue.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegrator.spentFuelProtocol = billingIntegrator.spentFuelProtocol.plus(getUsed);
    billingIntegrator.treasuryRevenue = billingIntegrator.treasuryRevenue.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuelProtocol = billingIntegratorDay.spentFuelProtocol.plus(getUsed);
    billingIntegratorDay.treasuryRevenue = billingIntegratorDay.treasuryRevenue.plus(getUsed);

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);
    billingIntegrator.currentReservedFuelProtocol = billingIntegrator.currentReservedFuelProtocol.minus(getUsed);

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, 0, event, nftIndex, "SCANNED", e.params.orderTime, BIG_DECIMAL_ZERO, getUsed, getUsed);
  }

  protocol.save();
  protocolDay.save();
}

export function handleCheckedIn(e: CheckedIn): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(ticket.event == "" ? ADDRESS_ZERO : Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  ticket.isCheckedIn = true;

  protocol.checkedInCount = protocol.checkedInCount.plus(BIG_INT_ONE);
  protocolDay.checkedInCount = protocolDay.checkedInCount.plus(BIG_INT_ONE);
  integrator.checkedInCount = integrator.checkedInCount.plus(BIG_INT_ONE);
  integratorDay.checkedInCount = integratorDay.checkedInCount.plus(BIG_INT_ONE);
  event.checkedInCount = event.checkedInCount.plus(BIG_INT_ONE);

  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let billingIntegrator = getIntegratorByRelayerAddress(e.transaction.from);
    let billingIntegratorDay = getIntegratorDayByIndexAndEvent(billingIntegrator.id, e);
    let getUsed = ticket.reservedFuel.times(BIG_DECIMAL_1E3);

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocol.spentFuelProtocol = protocol.spentFuelProtocol.plus(getUsed);
    protocol.treasuryRevenue = protocol.treasuryRevenue.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    protocolDay.spentFuelProtocol = protocolDay.spentFuelProtocol.plus(getUsed);
    protocolDay.treasuryRevenue = protocolDay.treasuryRevenue.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegrator.spentFuelProtocol = billingIntegrator.spentFuelProtocol.plus(getUsed);
    billingIntegrator.treasuryRevenue = billingIntegrator.treasuryRevenue.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuelProtocol = billingIntegratorDay.spentFuelProtocol.plus(getUsed);
    billingIntegratorDay.treasuryRevenue = billingIntegratorDay.treasuryRevenue.plus(getUsed);

    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);
    billingIntegrator.currentReservedFuelProtocol = billingIntegrator.currentReservedFuelProtocol.minus(getUsed);

    billingIntegrator.save();
    billingIntegratorDay.save();

    createUsageEvent(e, 0, event, nftIndex, "CHECKED_IN", e.params.orderTime, BIG_DECIMAL_ZERO, getUsed, getUsed);
  }

  protocol.save();
  protocolDay.save();
}

export function handleNftClaimed(e: NftClaimed): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(ticket.event == "" ? ADDRESS_ZERO : Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

  ticket.isClaimed = true;

  protocol.claimedCount = protocol.claimedCount.plus(BIG_INT_ONE);
  protocolDay.claimedCount = protocolDay.claimedCount.plus(BIG_INT_ONE);
  integrator.claimedCount = integrator.claimedCount.plus(BIG_INT_ONE);
  integratorDay.claimedCount = integratorDay.claimedCount.plus(BIG_INT_ONE);
  event.claimedCount = event.claimedCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  event.save();
  ticket.save();

  createUsageEvent(e, 0, event, nftIndex, "CLAIMED", e.params.orderTime, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
}
