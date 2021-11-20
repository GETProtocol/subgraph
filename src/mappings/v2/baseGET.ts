import { BigInt } from "@graphprotocol/graph-ts";
import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_INT_ONE,
  BIG_INT_ZERO,
  CURRENCY_CONVERSION_ACTIVATED_BLOCK,
  ECONOMICS_ADDRESS_V2,
  FUEL_ACTIVATED_BLOCK,
  NFT_ADDRESS_V2,
} from "../../constants";
import {
  PrimarySaleMint,
  TicketInvalidated,
  TicketScanned,
  NftClaimed,
  CheckedIn,
  SecondarySale,
  BaseGETV2 as BaseGETContractV2,
} from "../../../generated/BaseGETV2/BaseGETV2";
import { EconomicsGETV2 as EconomicsGETContractV2 } from "../../../generated/EconomicsGETV2/EconomicsGETV2";
import {
  getProtocol,
  getRelayer,
  getProtocolDay,
  getRelayerDay,
  getEvent,
  getTicket,
  createUsageEvent,
} from "../../entities";

export function handlePrimarySaleMint(e: PrimarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let ticket = getTicket(nftIndex);

  let ticketData = BaseGETContractV2.bind(NFT_ADDRESS_V2).try_ticketMetadataIndex(nftIndex);
  let primaryPrice = BIG_INT_ZERO;
  let eventAddress = ADDRESS_ZERO.toHexString();
  if (!ticketData.reverted) {
    primaryPrice = ticketData.value.value2[0];
    eventAddress = ticketData.value.value0.toHexString();
  }

  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEvent(eventAddress);

  ticket.createTx = e.transaction.hash;
  ticket.relayer = relayer.id;
  ticket.event = event.id;
  // The basePrice is always denominated in USD but the conversion did not go live for this until after the start of
  // this contract. For that reason we fetch the primary price (in local currency) from the contract view function
  // before making the conversion. This was only necessary for the first day of the contract launch (2020-10-20).
  //
  // You may also notice that these values differ slightly from those in the v1/baseGET mapping due to being able to
  // select the exact date required, whereas the v1 mappings cover the period from contract start to the v2 release.
  //
  // From this point onwards all conversion will be handled by TicketEngine and all basePrice (USD) will be passed in.
  if (e.block.number.lt(CURRENCY_CONVERSION_ACTIVATED_BLOCK)) {
    let rate = 100;
    if (event.currency == "AUD") rate = 75;
    if (event.currency == "CAD") rate = 81;
    if (event.currency == "EUR") rate = 116;
    if (event.currency == "GBP") rate = 138;
    ticket.basePrice = primaryPrice.times(BigInt.fromI32(rate)).div(BigInt.fromI32(1000));
  } else {
    ticket.basePrice = e.params.basePrice.div(BigInt.fromI32(10));
  }

  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  relayer.mintCount = relayer.mintCount.plus(BIG_INT_ONE);
  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    let getUsedResult = EconomicsGETContractV2.bind(ECONOMICS_ADDRESS_V2).try_viewBackPackBalance(nftIndex);

    if (!getUsedResult.reverted) {
      let getUsed = getUsedResult.value.divDecimal(BIG_DECIMAL_1E18);
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

      relayer.siloBalance = relayer.siloBalance.minus(getUsed);
      // We store the newly set relayer.siloBalance on the relayerDay as-is to be able to track the balance over time.
      relayerDay.siloBalance = relayer.siloBalance;
    }
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
    let getUsed = ticket.getHeldInFuelTank;

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

    protocol.depotBalance = protocol.depotBalance.plus(getUsed);
    protocolDay.depotBalance = protocol.depotBalance;
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
    let getUsed = ticket.getHeldInFuelTank;

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

    protocol.depotBalance = protocol.depotBalance.plus(getUsed);
    protocolDay.depotBalance = protocol.depotBalance;
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
    let getUsed = ticket.getHeldInFuelTank;

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

    protocol.depotBalance = protocol.depotBalance.plus(getUsed);
    protocolDay.depotBalance = protocol.depotBalance;
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
