import { BIG_DECIMAL_1E18, BIG_INT_ONE, FUEL_ACTIVATED_BLOCK } from "../../constants";
import {
  PrimarySaleMint,
  TicketInvalidated,
  TicketScanned,
  NftClaimed,
  CheckedIn,
  SecondarySale,
} from "../../../generated/BaseGETV2/BaseGETV2";
import {
  getProtocol,
  getRelayer,
  getProtocolDay,
  getRelayerDay,
  getEvent,
  getEventByNftIndexV2,
  getTicket,
  createUsageEvent,
} from "../../entities";

export function handlePrimarySaleMint(e: PrimarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV2(nftIndex);

  ticket.createTx = e.transaction.hash;
  ticket.relayer = relayer.id;
  ticket.event = event.id;
  ticket.basePrice = e.params.basePrice;

  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  relayer.mintCount = relayer.mintCount.plus(BIG_INT_ONE);
  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);

    protocol.getDebitedFromSilos = protocol.getDebitedFromSilos.plus(getUsed);
    protocolDay.getDebitedFromSilos = protocolDay.getDebitedFromSilos.plus(getUsed);
    relayer.getDebitedFromSilo = relayer.getDebitedFromSilo.plus(getUsed);
    relayerDay.getDebitedFromSilo = relayerDay.getDebitedFromSilo.plus(getUsed);
    event.getDebitedFromSilo = event.getDebitedFromSilo.plus(getUsed);
    ticket.getDebitedFromSilo = ticket.getDebitedFromSilo.plus(getUsed);

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.plus(getUsed);
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.plus(getUsed);
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.plus(getUsed);
    ticket.getHeldInFuelTank = ticket.getHeldInFuelTank.plus(getUsed);

    protocol.averageGetPerMint = protocol.getDebitedFromSilos.div(protocol.mintCount.toBigDecimal());
    protocolDay.averageGetPerMint = protocolDay.getDebitedFromSilos.div(protocolDay.mintCount.toBigDecimal());
    relayer.averageGetPerMint = relayer.getDebitedFromSilo.div(relayer.mintCount.toBigDecimal());
    relayerDay.averageGetPerMint = relayerDay.getDebitedFromSilo.div(relayerDay.mintCount.toBigDecimal());
    event.averageGetPerMint = event.getDebitedFromSilo.div(event.mintCount.toBigDecimal());
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();
  ticket.save();

  createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, e.params.getUsed);
}

export function handleTicketInvalidated(e: TicketInvalidated): void {
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

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);

    protocol.getCreditedToDepot = protocol.getCreditedToDepot.plus(getUsed);
    protocolDay.getCreditedToDepot = protocolDay.getCreditedToDepot.plus(getUsed);
    relayer.getCreditedToDepot = relayer.getCreditedToDepot.plus(getUsed);
    relayerDay.getCreditedToDepot = relayerDay.getCreditedToDepot.plus(getUsed);
    event.getCreditedToDepot = event.getCreditedToDepot.plus(getUsed);
    ticket.getCreditedToDepot = ticket.getCreditedToDepot.plus(getUsed);

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.minus(getUsed);
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.minus(getUsed);
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.minus(getUsed);
    ticket.getHeldInFuelTank = ticket.getHeldInFuelTank.minus(getUsed);
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();
  ticket.save();

  createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, e.params.getUsed);
}

export function handleSecondarySale(e: SecondarySale): void {
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

  createUsageEvent(e, event, nftIndex, "RESALE", e.params.orderTime, e.params.getUsed);
}

export function handleTicketScanned(e: TicketScanned): void {
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

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);

    protocol.getCreditedToDepot = protocol.getCreditedToDepot.plus(getUsed);
    protocolDay.getCreditedToDepot = protocolDay.getCreditedToDepot.plus(getUsed);
    relayer.getCreditedToDepot = relayer.getCreditedToDepot.plus(getUsed);
    relayerDay.getCreditedToDepot = relayerDay.getCreditedToDepot.plus(getUsed);
    event.getCreditedToDepot = event.getCreditedToDepot.plus(getUsed);
    ticket.getCreditedToDepot = ticket.getCreditedToDepot.plus(getUsed);

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.minus(getUsed);
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.minus(getUsed);
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.minus(getUsed);
    ticket.getHeldInFuelTank = ticket.getHeldInFuelTank.minus(getUsed);
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();
  ticket.save();

  createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, e.params.getUsed);
}

export function handleCheckedIn(e: CheckedIn): void {
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

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsed = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);

    protocol.getCreditedToDepot = protocol.getCreditedToDepot.plus(getUsed);
    protocolDay.getCreditedToDepot = protocolDay.getCreditedToDepot.plus(getUsed);
    relayer.getCreditedToDepot = relayer.getCreditedToDepot.plus(getUsed);
    relayerDay.getCreditedToDepot = relayerDay.getCreditedToDepot.plus(getUsed);
    event.getCreditedToDepot = event.getCreditedToDepot.plus(getUsed);
    ticket.getCreditedToDepot = ticket.getCreditedToDepot.plus(getUsed);

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.minus(getUsed);
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.minus(getUsed);
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.minus(getUsed);
    ticket.getHeldInFuelTank = ticket.getHeldInFuelTank.minus(getUsed);
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();
  ticket.save();

  createUsageEvent(e, event, nftIndex, "CHECK_IN", e.params.orderTime, e.params.getUsed);
}

export function handleNftClaimed(e: NftClaimed): void {
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

  createUsageEvent(e, event, nftIndex, "CLAIM", e.params.orderTime, e.params.getUsed);
}
