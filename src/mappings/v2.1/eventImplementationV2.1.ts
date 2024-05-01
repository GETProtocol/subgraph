import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import {
  CheckedIn,
  Claimed,
  Invalidated,
  PrimarySale,
  Scanned,
  SecondarySale,
} from "../../../generated/templates/EventImplementationV2_1/EventImplementationV2_1";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ZERO, V2_1_FUEL_FIX_BLOCK } from "../../constants";
import { calculateReservedFuelPrimary, calculateReservedFuelSecondary, createUsageEvent, getEvent, getTicket } from "../../entities";
import { EventDataSet } from "../../../generated/templates/EventImplementation/EventImplementation";

import * as integrator from "../../entities/integrator";
import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import * as integratorDay from "../../entities/integratorDay";
import * as event from "../../entities/event";

// In this version of the onchain economics, fuel is immediately routed to a vesting contract at point of primary or secondary sale.
// Events such as checkedIn, invalidated and scanned actually do not spend fuel.
// However, we perform a manual calculation of what could have been spent using the old accounting system to track and update data.
// The fuel

// We had a bug in the contracts that affected the values of the emitted events of ticket sales and possibly resales.
// We were adding the protocol fuel used twice in the total fuel used. As a result we had a divergence of Fuel
// balances on the subgraph from their actual balances on chain. This bug was fixed on the `V2_1_FUEL_FIX_BLOCK`
function getCorrectReservedFuel(totalFuelUsed: BigDecimal, protocolFuelUsed: BigDecimal, blockNumber: BigInt): BigDecimal {
  return blockNumber.gt(V2_1_FUEL_FIX_BLOCK) ? totalFuelUsed : totalFuelUsed.minus(protocolFuelUsed);
}

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

export function handlePrimarySale(e: PrimarySale): void {
  // Protocol and product fee is routed to the FuelCollector contract on primary sale
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E18);
  // fix reserved fuel value if prior to fuel fix block
  reservedFuel = getCorrectReservedFuel(reservedFuel, reservedFuelProtocol, e.block.number);
  let reservedFuelProtocolPerTicket = reservedFuelProtocol.div(BigDecimal.fromString(countBigInt.toString()));
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
      reservedFuelProtocolPerTicket
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
  let reservedFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E18); // this is "expected" to always be 0
  // fix reserved fuel value if prior to fuel fix block
  reservedFuel = getCorrectReservedFuel(reservedFuel, reservedFuelProtocol, e.block.number);
  let eventInstance = getEvent(e.address);
  let integratorInstance = integrator.getIntegrator(eventInstance.integrator);

  let cumulativeTicketValue = BIG_DECIMAL_ZERO;
  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);
    ticket.reservedFuel = ticket.reservedFuel.plus(calculateReservedFuelSecondary(ticket, integratorInstance));

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
      BIG_DECIMAL_ZERO
    );
  }

  eventInstance.accountDeductionUsd = eventInstance.accountDeductionUsd.plus(reservedFuel.times(integratorInstance.price));
  eventInstance.save();

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);

  protocol.updateSecondarySale(countBigInt, reservedFuel, BIG_DECIMAL_ZERO);
  protocolDay.updateSecondarySale(e, countBigInt, reservedFuel, BIG_DECIMAL_ZERO);

  integrator.updateSecondarySale(eventInstance.integrator, countBigInt, reservedFuel, BIG_DECIMAL_ZERO);
  integratorDay.updateSecondarySale(eventInstance.integrator, e, countBigInt, reservedFuel, BIG_DECIMAL_ZERO);

  event.updateSecondarySale(e.address, countBigInt, reservedFuel, BIG_DECIMAL_ZERO);
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

    createUsageEvent(
      e,
      i,
      eventInstance,
      ticketAction.tokenId,
      "SCANNED",
      ticketAction.orderTime,
      BIG_DECIMAL_ZERO,
      BIG_DECIMAL_ZERO,
      BIG_DECIMAL_ZERO
    );
  }

  protocol.updateScanned(countBigInt, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
  protocolDay.updateScanned(e, countBigInt, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
  integrator.updateScanned(eventInstance.integrator, countBigInt, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
  integratorDay.updateScanned(eventInstance.integrator, e, countBigInt);
  event.updateScanned(e.address, countBigInt);
}

export function handleCheckedIn(e: CheckedIn): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isCheckedIn = true;
    ticket.save();

    createUsageEvent(e, i, eventInstance, ticketAction.tokenId, "CHECKED_IN", ticketAction.orderTime, BIG_DECIMAL_ZERO);
  }

  protocol.updateCheckedIn(countBigInt);
  protocolDay.updateCheckedIn(e, countBigInt);
  integrator.updateCheckedIn(eventInstance.integrator, countBigInt);
  integratorDay.updateCheckedIn(eventInstance.integrator, e, countBigInt);
  event.updateCheckedIn(e.address, countBigInt);
}

export function handleInvalidated(e: Invalidated): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let eventInstance = getEvent(e.address);

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isInvalidated = true;
    ticket.save();

    createUsageEvent(e, i, eventInstance, ticketAction.tokenId, "INVALIDATED", ticketAction.orderTime);
  }

  protocol.updateInvalidated(countBigInt);
  protocolDay.updateInvalidated(e, countBigInt);
  integrator.updateInvalidated(eventInstance.integrator, countBigInt);
  integratorDay.updateInvalidated(eventInstance.integrator, e, countBigInt);
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
