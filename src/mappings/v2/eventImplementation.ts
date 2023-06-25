import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  CheckedIn,
  Claimed,
  EventDataSet,
  EventDataUpdated,
  Invalidated,
  PrimarySale,
  Scanned,
  SecondarySale,
  Transfer,
} from "../../../generated/templates/EventImplementation/EventImplementation";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ONE, BIG_DECIMAL_ZERO } from "../../constants";
import {
  GUTS_ON_CREDIT_BLOCK,
  GET_SAAS,
  GUTS_INTEGRATOR_ID,
  GUTS_ON_CREDIT_DAY,
  STAKING,
  FUEL_BRIDGE_RECEIVER,
} from "../../constants/contracts";
import {
  calculateReservedFuelPrimary,
  calculateReservedFuelProtocol,
  calculateReservedFuelSecondary,
  createUsageEvent,
  getEvent,
  getSpentFuelRecipientPercentage,
  getTicket,
} from "../../entities";
import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import * as integrator from "../../entities/integrator";
import * as integratorDay from "../../entities/integratorDay";
import * as event from "../../entities/event";

// -- Event Lifecycle Methods

export function handleEventDataSet(e: EventDataSet): void {
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegratorByRelayerAddress(e.transaction.from);
  let eventData = e.params.eventData;

  eventInstance.integrator = integratorInstance.id;
  eventInstance.relayer = e.transaction.from.toHexString();
  eventInstance.eventIndex = eventData.index;
  eventInstance.name = eventData.name;
  eventInstance.shopUrl = eventData.shopUrl;
  eventInstance.imageUrl = eventData.imageUrl;
  eventInstance.latitude = BigDecimal.fromString(eventData.latitude.toString()).div(BigDecimal.fromString("1000000"));
  eventInstance.longitude = BigDecimal.fromString(eventData.longitude.toString()).div(BigDecimal.fromString("1000000"));
  eventInstance.currency = eventData.currency;
  eventInstance.startTime = eventData.startTime;
  eventInstance.endTime = eventData.endTime;

  eventInstance.save();
}

export function handleEventDataUpdated(e: EventDataUpdated): void {
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegratorByRelayerAddress(e.transaction.from);
  let eventData = e.params.eventData;

  eventInstance.integrator = integratorInstance.id;
  eventInstance.relayer = e.transaction.from.toHexString();
  eventInstance.eventIndex = eventData.index;
  eventInstance.name = eventData.name;
  eventInstance.shopUrl = eventData.shopUrl;
  eventInstance.imageUrl = eventData.imageUrl;
  eventInstance.latitude = BigDecimal.fromString(eventData.latitude.toString()).div(BigDecimal.fromString("1000000"));
  eventInstance.longitude = BigDecimal.fromString(eventData.longitude.toString()).div(BigDecimal.fromString("1000000"));
  eventInstance.currency = eventData.currency;
  eventInstance.startTime = eventData.startTime;
  eventInstance.endTime = eventData.endTime;

  eventInstance.save();
}

// -- Ticket Lifecycle Methods

export function handlePrimarySale(e: PrimarySale): void {
  // We don't/can't emit the reserved fuel to each ticket without balooning gas usage so the subgraph only tracks an
  // esitmated reading of this by taking the total GET used and dividing that by the number of tickets in the batch.
  // To get a more accurate reading here in the subgraph we would need to fetch the integrator's min/max fee and their
  // rate, then duplicate the logic that is in the contracts for assigning the fees. Pass for now.
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E18);
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegrator(eventInstance.integrator);

  let cumulativeTicketValue = BIG_DECIMAL_ZERO;
  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);
    ticket.createTx = e.transaction.hash;
    ticket.blockNumber = e.block.number;
    ticket.blockTimestamp = e.block.timestamp;
    ticket.event = eventInstance.id;
    ticket.relayer = e.transaction.from.toHexString();
    ticket.integrator = eventInstance.integrator;
    ticket.basePrice = ticketAction.basePrice.divDecimal(BIG_DECIMAL_1E3);
    ticket.reservedFuel = calculateReservedFuelPrimary(ticket, integratorInstance);
    ticket.reservedFuelProtocol = calculateReservedFuelProtocol(ticket, integratorInstance);
    ticket.save();

    cumulativeTicketValue = cumulativeTicketValue.plus(ticket.basePrice);
    createUsageEvent(
      e,
      i,
      eventInstance,
      ticketAction.tokenId,
      "SOLD",
      ticketAction.orderTime,
      ticket.basePrice,
      ticket.reservedFuel,
      ticket.reservedFuelProtocol
    );
  }

  eventInstance.accountDeductionUsd = eventInstance.accountDeductionUsd.plus(reservedFuel.times(integratorInstance.price));
  eventInstance.save();

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);

  protocol.updatePrimarySale(countBigInt, reservedFuel, reservedFuelProtocol);
  protocolDay.updatePrimarySale(e, countBigInt, reservedFuel, reservedFuelProtocol);
  integrator.updatePrimarySale(eventInstance.integrator, countBigInt, reservedFuel, reservedFuelProtocol);
  integratorDay.updatePrimarySale(eventInstance.integrator, e, countBigInt, reservedFuel, reservedFuelProtocol);
  event.updatePrimarySale(e.address, countBigInt, reservedFuel, reservedFuelProtocol);
}

export function handleSecondarySale(e: SecondarySale): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E18);
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegrator(eventInstance.integrator);

  let cumulativeTicketValue = BIG_DECIMAL_ZERO;
  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);
    ticket.reservedFuel = ticket.reservedFuel.plus(calculateReservedFuelSecondary(ticket, integratorInstance));
    ticket.reservedFuelProtocol = ticket.reservedFuelProtocol.plus(calculateReservedFuelProtocol(ticket, integratorInstance));
    ticket.save();

    cumulativeTicketValue = cumulativeTicketValue.plus(ticket.basePrice);
    createUsageEvent(
      e,
      i,
      eventInstance,
      ticketAction.tokenId,
      "RESOLD",
      ticketAction.orderTime,
      ticketAction.basePrice.divDecimal(BIG_DECIMAL_1E3),
      ticket.reservedFuel,
      ticket.reservedFuelProtocol
    );
  }

  eventInstance.accountDeductionUsd = eventInstance.accountDeductionUsd.plus(reservedFuel.times(integratorInstance.price));
  eventInstance.save();

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);

  protocol.updateSecondarySale(countBigInt, reservedFuel, reservedFuelProtocol);
  protocolDay.updateSecondarySale(e, countBigInt, reservedFuel, reservedFuelProtocol);
  integrator.updateSecondarySale(eventInstance.integrator, countBigInt, reservedFuel, reservedFuelProtocol);
  integratorDay.updateSecondarySale(eventInstance.integrator, e, countBigInt, reservedFuel, reservedFuelProtocol);
  event.updateSecondarySale(e.address, countBigInt, reservedFuel, reservedFuelProtocol);
}

export function handleScanned(e: Scanned): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isScanned = true;
    ticket.save();

    createUsageEvent(e, i, eventInstance, ticketAction.tokenId, "SCANNED", ticketAction.orderTime);
  }

  protocol.updateScanned(countBigInt);
  protocolDay.updateScanned(e, countBigInt);
  integrator.updateScanned(eventInstance.integrator, countBigInt);
  integratorDay.updateScanned(eventInstance.integrator, e, countBigInt);
  event.updateScanned(e.address, countBigInt);
}

export function handleCheckedIn(e: CheckedIn): void {
  let holdersRevenue: BigDecimal;
  let treasuryRevenue: BigDecimal;
  let percentageStaking = BIG_DECIMAL_ZERO;
  let percentageTreasury = BIG_DECIMAL_ONE;

  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let spentFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let spentFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E18);
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegrator(eventInstance.integrator);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isCheckedIn = true;
    ticket.save();

    createUsageEvent(
      e,
      i,
      eventInstance,
      ticketAction.tokenId,
      "CHECKED_IN",
      ticketAction.orderTime,
      BIG_DECIMAL_ZERO,
      spentFuel,
      spentFuelProtocol
    );
  }

  const remainder = spentFuel.minus(spentFuelProtocol);

  const day = protocolDay.getProtocolDay(e).day;

  //GUTS Tickets has turned into an onCredit integrator on day "GUTS_ON_CREDIT_DAY", without an on chain transaction.
  //This means that all the revenue generated by GUTS Tickets will go to stakers, except for "spentFuelProtocol" from day "GUTS_ON_CREDIT_DAY".
  //onCredit status of GUTS Tickets was set on chain on block number "GUTS_ON_CREDIT_BLOCK".
  if (
    (day >= GUTS_ON_CREDIT_DAY && eventInstance.integrator == GUTS_INTEGRATOR_ID && e.block.number.lt(GUTS_ON_CREDIT_BLOCK)) ||
    integratorInstance.isOnCredit
  ) {
    percentageTreasury = BIG_DECIMAL_ZERO;
    percentageStaking = BIG_DECIMAL_ONE;
  } else {
    let percentageEthStaking = getSpentFuelRecipientPercentage(FUEL_BRIDGE_RECEIVER);
    let percentagePolyStaking = getSpentFuelRecipientPercentage(STAKING);

    percentageTreasury = getSpentFuelRecipientPercentage(GET_SAAS);
    percentageStaking = percentageEthStaking.plus(percentagePolyStaking);
  }

  treasuryRevenue = remainder.times(percentageTreasury).plus(spentFuelProtocol);
  holdersRevenue = remainder.times(percentageStaking);

  protocol.updateCheckedIn(countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);
  protocolDay.updateCheckedIn(e, countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);
  integrator.updateCheckedIn(eventInstance.integrator, countBigInt, spentFuel, spentFuelProtocol);
  integratorDay.updateCheckedIn(eventInstance.integrator, e, countBigInt, spentFuel, spentFuelProtocol);
  event.updateCheckedIn(e.address, countBigInt);
}

export function handleInvalidated(e: Invalidated): void {
  let holdersRevenue: BigDecimal;
  let treasuryRevenue: BigDecimal;
  let percentageStaking = BIG_DECIMAL_ZERO;
  let percentageTreasury = BIG_DECIMAL_ONE;
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let spentFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let spentFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E18);
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegrator(eventInstance.integrator);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isInvalidated = true;
    ticket.save();

    createUsageEvent(
      e,
      i,
      eventInstance,
      ticketAction.tokenId,
      "INVALIDATED",
      ticketAction.orderTime,
      BIG_DECIMAL_ZERO,
      spentFuel,
      spentFuelProtocol
    );
  }

  const remainder = spentFuel.minus(spentFuelProtocol);

  const day = protocolDay.getProtocolDay(e).day;

  //GUTS Tickets has turned into an onCredit integrator on day "GUTS_ON_CREDIT_DAY", without an on chain transaction.
  //This means that all the revenue generated by GUTS Tickets will go to stakers, except for "spentFuelProtocol" from day "GUTS_ON_CREDIT_DAY".
  //onCredit status of GUTS Tickets was set on chain on block number "GUTS_ON_CREDIT_BLOCK".
  if (
    (day >= GUTS_ON_CREDIT_DAY && eventInstance.integrator == GUTS_INTEGRATOR_ID && e.block.number.lt(GUTS_ON_CREDIT_BLOCK)) ||
    integratorInstance.isOnCredit
  ) {
    percentageTreasury = BIG_DECIMAL_ZERO;
    percentageStaking = BIG_DECIMAL_ONE;
  } else {
    let percentageEthStaking = getSpentFuelRecipientPercentage(FUEL_BRIDGE_RECEIVER);
    let percentagePolyStaking = getSpentFuelRecipientPercentage(STAKING);
    percentageStaking = percentageEthStaking.plus(percentagePolyStaking);
    percentageTreasury = getSpentFuelRecipientPercentage(GET_SAAS);
  }

  treasuryRevenue = remainder.times(percentageTreasury).plus(spentFuelProtocol);
  holdersRevenue = remainder.times(percentageStaking);

  protocol.updateInvalidated(countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);
  protocolDay.updateInvalidated(e, countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);
  integrator.updateInvalidated(eventInstance.integrator, countBigInt, spentFuel, spentFuelProtocol);
  integratorDay.updateInvalidated(eventInstance.integrator, e, countBigInt, spentFuel, spentFuelProtocol);
  event.updateInvalidated(e.address, countBigInt);
}

export function handleClaimed(e: Claimed): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isClaimed = true;
    ticket.save();

    createUsageEvent(e, i, eventInstance, ticketAction.tokenId, "CLAIMED", ticketAction.orderTime);
  }

  protocol.updateClaimed(countBigInt);
  protocolDay.updateClaimed(e, countBigInt);
  integrator.updateClaimed(eventInstance.integrator, countBigInt);
  integratorDay.updateClaimed(eventInstance.integrator, e, countBigInt);
  event.updateClaimed(e.address, countBigInt);
}

export function handleTransfer(e: Transfer): void {
  let eventInstance = getEvent(e.address);
  let ticket = getTicket(eventInstance.eventIndex, e.params.tokenId);
  ticket.owner = e.params.to;
  ticket.save();
}
