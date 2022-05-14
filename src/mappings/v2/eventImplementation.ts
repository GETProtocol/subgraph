import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  CheckedIn,
  EventDataSet,
  EventDataUpdated,
  Invalidated,
  PrimaryMint,
  Scanned,
  SecondarySale,
} from "../../../generated/templates/EventImplementation/EventImplementation";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ZERO } from "../../constants";
import { createUsageEvent, getEvent, getTicket } from "../../entities";
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

export function handlePrimaryMint(e: PrimaryMint): void {
  // We don't/can't emit the reserved fuel to each ticket without balooning gas usage so the subgraph only tracks an
  // esitmated reading of this by taking the total GET used and dividing that by the number of tickets in the batch.
  // To get a more accurate reading here in the subgraph we would need to fetch the integrator's min/max fee and their
  // rate, then duplicate the logic that is in the contracts for assigning the fees. Pass for now.
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelPerTicket = reservedFuel.div(countBigInt.toBigDecimal());
  let eventInstance = getEvent(e.address);

  let cumulativeTicketValue = BIG_DECIMAL_ZERO;
  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);
    ticket.event = eventInstance.id;
    ticket.relayer = e.transaction.from.toHexString();
    ticket.integrator = eventInstance.integrator;
    ticket.basePrice = ticketAction.basePrice.divDecimal(BIG_DECIMAL_1E3);
    ticket.reservedFuel = reservedFuelPerTicket;
    ticket.save();

    cumulativeTicketValue = cumulativeTicketValue.plus(ticket.basePrice);
    createUsageEvent(e, eventInstance, ticketAction.tokenId, "MINT", ticketAction.orderTime, reservedFuelPerTicket);
  }

  protocol.updateTotalTicketValue(cumulativeTicketValue);
  protocolDay.updateTotalTicketValue(e, cumulativeTicketValue);

  protocol.updatePrimaryMint(countBigInt, reservedFuel);
  protocolDay.updatePrimaryMint(e, countBigInt, reservedFuel);
  integrator.updatePrimaryMint(eventInstance.integrator, countBigInt, reservedFuel);
  integratorDay.updatePrimaryMint(eventInstance.integrator, e, countBigInt, reservedFuel);
  event.updatePrimaryMint(e.address, countBigInt, reservedFuel);
}

export function handleSecondarySale(e: SecondarySale): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelPerTicket = reservedFuel.div(countBigInt.toBigDecimal());
  let eventInstance = getEvent(e.address);

  let cumulativeTicketValue = BIG_DECIMAL_ZERO;
  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);
    ticket.reservedFuel = ticket.reservedFuel.plus(reservedFuelPerTicket);
    ticket.save();

    cumulativeTicketValue = cumulativeTicketValue.plus(ticket.basePrice);
    createUsageEvent(e, eventInstance, ticketAction.tokenId, "RESALE", ticketAction.orderTime, reservedFuelPerTicket);
  }

  protocol.updateTotalTicketValue(cumulativeTicketValue);
  protocolDay.updateTotalTicketValue(e, cumulativeTicketValue);

  protocol.updateSecondarySale(countBigInt, reservedFuel);
  protocolDay.updateSecondarySale(e, countBigInt, reservedFuel);
  integrator.updateSecondarySale(eventInstance.integrator, countBigInt, reservedFuel);
  integratorDay.updateSecondarySale(eventInstance.integrator, e, countBigInt, reservedFuel);
  event.updateSecondarySale(e.address, countBigInt, reservedFuel);
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

    createUsageEvent(e, eventInstance, ticketAction.tokenId, "SCAN", ticketAction.orderTime, BIG_DECIMAL_ZERO);
  }

  protocol.updateScanned(countBigInt);
  protocolDay.updateScanned(e, countBigInt);
  integrator.updateScanned(eventInstance.integrator, countBigInt);
  integratorDay.updateScanned(eventInstance.integrator, e, countBigInt);
  event.updateScanned(e.address, countBigInt);
}

export function handleCheckedIn(e: CheckedIn): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let spentFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isCheckedIn = true;
    ticket.save();

    createUsageEvent(e, eventInstance, ticketAction.tokenId, "CHECK_IN", ticketAction.orderTime, spentFuel);
  }

  protocol.updateCheckedIn(countBigInt, spentFuel);
  protocolDay.updateCheckedIn(e, countBigInt, spentFuel);
  integrator.updateCheckedIn(eventInstance.integrator, countBigInt, spentFuel);
  integratorDay.updateCheckedIn(eventInstance.integrator, e, countBigInt, spentFuel);
  event.updateCheckedIn(e.address, countBigInt);
}

export function handleInvalidated(e: Invalidated): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let spentFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isInvalidated = true;
    ticket.save();

    createUsageEvent(e, eventInstance, ticketAction.tokenId, "INVALIDATE", ticketAction.orderTime, spentFuel);
  }

  protocol.updateInvalidated(countBigInt, spentFuel);
  protocolDay.updateInvalidated(e, countBigInt, spentFuel);
  integrator.updateInvalidated(eventInstance.integrator, countBigInt, spentFuel);
  integratorDay.updateInvalidated(eventInstance.integrator, e, countBigInt, spentFuel);
  event.updateInvalidated(e.address, countBigInt);
}

export function handleClaimed(e: Invalidated): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isClaimed = true;
    ticket.save();

    createUsageEvent(e, eventInstance, ticketAction.tokenId, "CLAIM", ticketAction.orderTime, BIG_DECIMAL_1E18);
  }

  protocol.updateClaimed(countBigInt);
  protocolDay.updateClaimed(e, countBigInt);
  integrator.updateClaimed(eventInstance.integrator, countBigInt);
  integratorDay.updateClaimed(eventInstance.integrator, e, countBigInt);
  event.updateClaimed(e.address, countBigInt);
}
