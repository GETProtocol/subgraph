import { BIG_DECIMAL_1E18, BIG_INT_ONE, FUEL_ACTIVATED_BLOCK } from "../../constants";
import { PrimarySaleMint, TicketInvalidated, TicketScanned, NftClaimed, CheckedIn } from "../../../generated/BaseGETV2/BaseGETV2";
import { getProtocol, getRelayer, getProtocolDay, getRelayerDay, getEventByNftIndexV2, createUsageEvent } from "../../entities";

export function handlePrimarySaleMint(e: PrimarySaleMint): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV2(nftIndex);

  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  relayer.mintCount = relayer.mintCount.plus(BIG_INT_ONE);
  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    protocol.getDebitedFromSilos = protocol.getDebitedFromSilos.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    protocolDay.getDebitedFromSilos = protocolDay.getDebitedFromSilos.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getDebitedFromSilo = relayer.getDebitedFromSilo.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayerDay.getDebitedFromSilo = relayerDay.getDebitedFromSilo.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getDebitedFromSilo = event.getDebitedFromSilo.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));

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

  createUsageEvent(e, event, nftIndex, "MINT", e.params.orderTime, e.params.getUsed);
}

export function handleTicketInvalidated(e: TicketInvalidated): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV2(nftIndex);

  protocol.invalidateCount = protocol.invalidateCount.plus(BIG_INT_ONE);
  protocolDay.invalidateCount = protocolDay.invalidateCount.plus(BIG_INT_ONE);
  relayer.invalidateCount = relayer.invalidateCount.plus(BIG_INT_ONE);
  relayerDay.invalidateCount = relayerDay.invalidateCount.plus(BIG_INT_ONE);
  event.invalidateCount = event.invalidateCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    protocol.getCreditedToDepot = protocol.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    protocolDay.getCreditedToDepot = protocolDay.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getCreditedToDepot = relayer.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayerDay.getCreditedToDepot = relayerDay.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getCreditedToDepot = event.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "INVALIDATE", e.params.orderTime, e.params.getUsed);
}

export function handleTicketScanned(e: TicketScanned): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV2(nftIndex);

  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);
  relayer.scanCount = relayer.scanCount.plus(BIG_INT_ONE);
  relayerDay.scanCount = relayerDay.scanCount.plus(BIG_INT_ONE);
  event.scanCount = event.scanCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    protocol.getCreditedToDepot = protocol.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    protocolDay.getCreditedToDepot = protocolDay.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getCreditedToDepot = relayer.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayerDay.getCreditedToDepot = relayerDay.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getCreditedToDepot = event.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "SCAN", e.params.orderTime, e.params.getUsed);
}

export function handleCheckedIn(e: CheckedIn): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV2(nftIndex);

  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);
  relayer.claimCount = relayer.claimCount.plus(BIG_INT_ONE);
  relayerDay.claimCount = relayerDay.claimCount.plus(BIG_INT_ONE);
  event.claimCount = event.claimCount.plus(BIG_INT_ONE);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    protocol.getCreditedToDepot = protocol.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    protocolDay.getCreditedToDepot = protocolDay.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getCreditedToDepot = relayer.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayerDay.getCreditedToDepot = relayerDay.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getCreditedToDepot = event.getCreditedToDepot.plus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));

    protocol.getHeldInFuelTanks = protocol.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    relayer.getHeldInFuelTanks = relayer.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
    event.getHeldInFuelTanks = event.getHeldInFuelTanks.minus(e.params.getUsed.divDecimal(BIG_DECIMAL_1E18));
  }

  protocol.save();
  protocolDay.save();
  relayer.save();
  relayerDay.save();
  event.save();

  createUsageEvent(e, event, nftIndex, "CHECK_IN", e.params.orderTime, e.params.getUsed);
}

export function handleNftClaimed(e: NftClaimed): void {
  let nftIndex = e.params.nftIndex;
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);
  let relayerDay = getRelayerDay(e);
  let relayer = getRelayer(e);
  let event = getEventByNftIndexV2(nftIndex);

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
