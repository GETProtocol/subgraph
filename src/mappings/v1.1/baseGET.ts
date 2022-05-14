import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E3,
  BIG_DECIMAL_ZERO,
  BIG_INT_ONE,
  BIG_INT_ZERO,
  CURRENCY_CONVERSION_ACTIVATED_BLOCK,
  FUEL_ACTIVATED_BLOCK,
  NFT_ADDRESS_V1_1,
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
} from "../../entities";

export function handlePrimarySaleMint(e: PrimarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);

  // In this revision of the contracts the eventAddress was not emitted with the event meaning we need to fetch the data
  // from the node with an RPC call. Expensive to do in terms of indexing speed, can't be avoided here.
  let ticketData = BaseGETContractV1_1.bind(NFT_ADDRESS_V1_1).try_ticketMetadataIndex(nftIndex);
  let primaryPrice = BIG_INT_ZERO;
  let eventAddress = ADDRESS_ZERO;
  if (!ticketData.reverted) {
    primaryPrice = ticketData.value.value2[0];
    eventAddress = ticketData.value.value0;
  }

  let event = getEvent(eventAddress);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);
  let relayer = getRelayer(e.transaction.from);
  let billingIntegrator = getIntegrator(relayer.integrator);
  let billingIntegratorDay = getIntegratorDayByIndexAndEvent(relayer.integrator, e);

  ticket.createTx = e.transaction.hash;
  ticket.relayer = relayer.id;
  ticket.event = event.id;
  // The basePrice is always denominated in USD but the conversion did not go live for this until after the start of
  // this contract. For that reason we fetch the primary price (in local currency) from the contract view function
  // before making the conversion. This was only necessary for the first day of the contract launch (2020-10-20).
  //
  // You may also notice that these values differ slightly from those in the v1/baseGET mapping due to being able to
  // select the exact date required, whereas the v1 mappings cover the period from contract start to the v1.1 release.
  //
  // From this point onwards all conversion will be handled by TicketEngine and all basePrice (USD) will be passed in.
  if (e.block.number.lt(CURRENCY_CONVERSION_ACTIVATED_BLOCK)) {
    let rate = 100;
    if (event.currency == "AUD") rate = 75;
    if (event.currency == "CAD") rate = 81;
    if (event.currency == "EUR") rate = 116;
    if (event.currency == "GBP") rate = 138;
    ticket.basePrice = primaryPrice
      .toBigDecimal()
      .times(BigDecimal.fromString(rate.toString()))
      .div(BigDecimal.fromString("100000"));
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

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);

    protocol.reservedFuel = protocol.reservedFuel.plus(getUsed);
    protocolDay.reservedFuel = protocolDay.reservedFuel.plus(getUsed);
    billingIntegrator.reservedFuel = billingIntegrator.reservedFuel.plus(getUsed);
    billingIntegratorDay.reservedFuel = billingIntegratorDay.reservedFuel.plus(getUsed);
    event.reservedFuel = event.reservedFuel.plus(getUsed);
    ticket.reservedFuel = ticket.reservedFuel.plus(getUsed);

    billingIntegrator.availableFuel = billingIntegrator.availableFuel.minus(getUsed);
    billingIntegratorDay.availableFuel = billingIntegrator.availableFuel;

    protocol.currentReservedFuel = protocol.currentReservedFuel.plus(getUsed);
    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.plus(getUsed);

    protocol.averageReservedPerTicket = protocol.reservedFuel.div(protocol.mintCount.toBigDecimal());
    protocolDay.averageReservedPerTicket = protocolDay.reservedFuel.div(protocolDay.mintCount.toBigDecimal());
    billingIntegrator.averageReservedPerTicket = billingIntegrator.reservedFuel.div(
      integrator.mintCount.toBigDecimal()
    );
    billingIntegratorDay.averageReservedPerTicket = billingIntegratorDay.reservedFuel.div(
      integratorDay.mintCount.toBigDecimal()
    );
    event.averageReservedPerTicket = event.reservedFuel.div(event.mintCount.toBigDecimal());

    createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, getUsed);
  }

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  billingIntegrator.save();
  billingIntegratorDay.save();
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
  let relayer = getRelayer(e.transaction.from);
  let billingIntegrator = getIntegrator(relayer.integrator);
  let billingIntegratorDay = getIntegratorDayByIndexAndEvent(relayer.integrator, e);

  protocol.invalidateCount = protocol.invalidateCount.plus(BIG_INT_ONE);
  protocolDay.invalidateCount = protocolDay.invalidateCount.plus(BIG_INT_ONE);
  integrator.invalidateCount = integrator.invalidateCount.plus(BIG_INT_ONE);
  integratorDay.invalidateCount = integratorDay.invalidateCount.plus(BIG_INT_ONE);
  event.invalidateCount = event.invalidateCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    // The only mechanism used in V1.1 was to fully re-allocate the ticket's 'backpack' to the DAO fee collector
    // address. Because of this we can assume the getUsed to be the full reserved fuel for that ticket.
    let getUsed = ticket.reservedFuel;

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);

    protocol.currentReservedFuel = protocol.currentReservedFuel.minus(getUsed);
    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);

    protocol.currentSpentFuel = protocol.currentSpentFuel.plus(getUsed);
    protocolDay.currentSpentFuel = protocol.currentSpentFuel;

    createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, getUsed);
  }

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  billingIntegrator.save();
  billingIntegratorDay.save();
  event.save();
  ticket.save();
}

export function handleSecondarySale(e: SecondarySale): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);

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

  createUsageEvent(e, event, nftIndex, "RESALE", e.params.orderTime, BIG_DECIMAL_ZERO);
}

export function handleTicketScanned(e: TicketScanned): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);
  let relayer = getRelayer(e.transaction.from);
  let billingIntegrator = getIntegrator(relayer.integrator);
  let billingIntegratorDay = getIntegratorDayByIndexAndEvent(relayer.integrator, e);

  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);
  integrator.scanCount = integrator.scanCount.plus(BIG_INT_ONE);
  integratorDay.scanCount = integratorDay.scanCount.plus(BIG_INT_ONE);
  event.scanCount = event.scanCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = ticket.reservedFuel;

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);

    protocol.currentReservedFuel = protocol.currentReservedFuel.minus(getUsed);
    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);

    protocol.currentSpentFuel = protocol.currentSpentFuel.plus(getUsed);
    protocolDay.currentSpentFuel = protocol.currentSpentFuel;

    createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, getUsed);
  }

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  billingIntegrator.save();
  billingIntegratorDay.save();
  event.save();
  ticket.save();
}

export function handleCheckedIn(e: CheckedIn): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(BIG_INT_ZERO, nftIndex);
  let event = getEvent(Address.fromString(ticket.event));
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let integrator = getIntegrator(event.integrator);
  let integratorDay = getIntegratorDayByIndexAndEvent(event.integrator, e);
  let relayer = getRelayer(e.transaction.from);
  let billingIntegrator = getIntegrator(relayer.integrator);
  let billingIntegratorDay = getIntegratorDayByIndexAndEvent(relayer.integrator, e);

  protocol.checkInCount = protocol.checkInCount.plus(BIG_INT_ONE);
  protocolDay.checkInCount = protocolDay.checkInCount.plus(BIG_INT_ONE);
  integrator.checkInCount = integrator.checkInCount.plus(BIG_INT_ONE);
  integratorDay.checkInCount = integratorDay.checkInCount.plus(BIG_INT_ONE);
  event.checkInCount = event.checkInCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = ticket.reservedFuel;

    protocol.spentFuel = protocol.spentFuel.plus(getUsed);
    protocolDay.spentFuel = protocolDay.spentFuel.plus(getUsed);
    billingIntegrator.spentFuel = billingIntegrator.spentFuel.plus(getUsed);
    billingIntegratorDay.spentFuel = billingIntegratorDay.spentFuel.plus(getUsed);

    protocol.currentReservedFuel = protocol.currentReservedFuel.minus(getUsed);
    billingIntegrator.currentReservedFuel = billingIntegrator.currentReservedFuel.minus(getUsed);

    protocol.currentSpentFuel = protocol.currentSpentFuel.plus(getUsed);
    protocolDay.currentSpentFuel = protocol.currentSpentFuel;

    createUsageEvent(e, event, nftIndex, "CHECK_IN", e.params.orderTime, getUsed);
  }

  protocol.save();
  protocolDay.save();
  integrator.save();
  integratorDay.save();
  billingIntegrator.save();
  billingIntegratorDay.save();
  event.save();
  ticket.save();
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

  createUsageEvent(e, event, nftIndex, "CLAIM", e.params.orderTime, BIG_DECIMAL_ZERO);
}
