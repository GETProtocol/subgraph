import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  CheckedIn,
  Claimed,
  Claimed1,
  EventDataSet,
  EventDataUpdated,
  Invalidated,
  PrimarySale,
  PrimarySale1,
  Scanned,
  SecondarySale,
  SecondarySale1,
  Transfer,
} from "../../../generated/templates/EventImplementation/EventImplementation";
import { BIG_DECIMAL_1E15, BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ONE, BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../../constants";
import {
  GUTS_ON_CREDIT_BLOCK,
  GET_SAAS,
  GUTS_INTEGRATOR_ID,
  GUTS_ON_CREDIT_DAY,
  STAKING,
  FUEL_BRIDGE_RECEIVER,
  ECONOMICS_V2_1_BLOCK,
  INTEGRATOR_AVERAGE_PRICES,
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

// We had a bug in the contracts that affected the values of the emitted events of ticket sales and possibly resales.
// We were adding the protocol fuel used twice in the total fuel used. As a result we had a divergence of Fuel
// balances on the subgraph from their actual balances on chain. This bug was fixed on the `ECONOMICS_V2_1_FUEL_FIX_BLOCK`
// This bug only affects events post `ECONOMICS_V2_1_BLOCK` and prior to `ECONOMICS_V2_1_FUEL_FIX_BLOCK`
function getCorrectReservedFuel(totalFuelUsed: BigDecimal, protocolFuelUsed: BigDecimal, blockNumber: BigInt): BigDecimal {
  return blockNumber.gt(ECONOMICS_V2_1_BLOCK) ? totalFuelUsed.minus(protocolFuelUsed) : totalFuelUsed;
}

// To get an average price for integrator top ups during the span of the v2.1 contracts,
// we compile a record of the average price of fuel spent by the integrator based on the price of top ups
// If an integrator didn't perform any top ups for the v2.1 contracts, we use the normal integrator price
// from all historical top ups on the integrator entity.
function getIntegratorPriceV2_1(integrator: string, defaultPrice: BigDecimal): BigDecimal {
  let price = INTEGRATOR_AVERAGE_PRICES.has(integrator) ? BigDecimal.fromString(INTEGRATOR_AVERAGE_PRICES.get(integrator)) : defaultPrice;
  return price.notEqual(BIG_DECIMAL_ZERO) ? price : defaultPrice;
}

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
  let isV2 = e.block.number.le(ECONOMICS_V2_1_BLOCK);

  // We don't/can't emit the reserved fuel to each ticket without balooning gas usage so the subgraph only tracks an
  // esitmated reading of this by taking the total GET used and dividing that by the number of tickets in the batch.
  // To get a more accurate reading here in the subgraph we would need to fetch the integrator's min/max fee and their
  // rate, then duplicate the logic that is in the contracts for assigning the fees. Pass for now.
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  // we divide by 1e15 instead of 1e18 for the GET -> OPN migration
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E15);
  let reservedFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E15);

  // fix reserved fuel value for V2.1 events if prior to fuel fix block
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
      reservedFuelProtocolPerTicket
    );
  }

  // This event handler will be called for all events for the v2 and v2.1 contracts.
  // Seeing the issue we unknowingly introduced in not emitting the fuel used in USD for the v2.1 contracts, we have to specially handle fuel used in USD for v2.1 events.
  // Note that the fuel emitted in USD was introduced in the v2.2 contracts for which we have a separate event handler in the v2.2 directory.

  if (isV2) {
    event.updateEventUSDBalance(e.address, reservedFuel.times(integratorInstance.price));
  } else {
    let price = getIntegratorPriceV2_1(eventInstance.integrator, integratorInstance.price);
    // handle update for fuel balances for protocol, integrator, and event instances for dark days
    // dark days being the days between v2.1 and v2.2
    const fuelUSD = reservedFuel.times(price);
    const protocolFuelUSD = reservedFuelProtocol.times(price);
    event.updateEventUSDBalance(e.address, fuelUSD);

    protocol.updateFuelBalances(reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);
    protocolDay.updateFuelBalances(e, reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);

    integrator.updateFuelBalances(eventInstance.integrator, reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);
    integratorDay.updateFuelBalances(eventInstance.integrator, e, reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);
  }

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);

  protocol.updatePrimarySale(countBigInt, reservedFuel, reservedFuelProtocol, isV2);
  protocolDay.updatePrimarySale(e, countBigInt, reservedFuel, reservedFuelProtocol);

  integrator.updatePrimarySale(eventInstance.integrator, countBigInt, reservedFuel, reservedFuelProtocol, isV2);
  integratorDay.updatePrimarySale(eventInstance.integrator, e, countBigInt, reservedFuel, reservedFuelProtocol);

  event.updatePrimarySale(e.address, countBigInt, reservedFuel, reservedFuelProtocol);
}

export function handleSecondarySale(e: SecondarySale): void {
  let isV2 = e.block.number.le(ECONOMICS_V2_1_BLOCK);

  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  // we divide by 1e15 instead of 1e18 for the GET -> OPN migration
  let reservedFuel = e.params.getUsed.divDecimal(BIG_DECIMAL_1E15);
  let reservedFuelProtocol = e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E15);

  // fix reserved fuel value for V2.1 events if prior to fuel fix block
  reservedFuel = getCorrectReservedFuel(reservedFuel, reservedFuelProtocol, e.block.number);

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
      isV2 ? ticket.reservedFuelProtocol : BIG_DECIMAL_ZERO
    );
  }

  if (isV2) {
    event.updateEventUSDBalance(e.address, reservedFuel.times(integratorInstance.price));
  } else {
    let price = getIntegratorPriceV2_1(eventInstance.integrator, integratorInstance.price);
    // handle update for fuel balances for protocol, integrator, and event instances for dark days
    // dark days being the days between v2.1 and v2.2
    const fuelUSD = reservedFuel.times(price);
    const protocolFuelUSD = reservedFuelProtocol.times(price);
    event.updateEventUSDBalance(e.address, fuelUSD);

    protocol.updateFuelBalances(reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);
    protocolDay.updateFuelBalances(e, reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);

    integrator.updateFuelBalances(eventInstance.integrator, reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);
    integratorDay.updateFuelBalances(eventInstance.integrator, e, reservedFuel, reservedFuelProtocol, fuelUSD, protocolFuelUSD);
  }

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);

  protocol.updateSecondarySale(countBigInt, reservedFuel, reservedFuelProtocol, isV2);
  protocolDay.updateSecondarySale(e, countBigInt, reservedFuel, reservedFuelProtocol);

  integrator.updateSecondarySale(eventInstance.integrator, countBigInt, reservedFuel, reservedFuelProtocol, isV2);
  integratorDay.updateSecondarySale(eventInstance.integrator, e, countBigInt, reservedFuel, reservedFuelProtocol);

  event.updateSecondarySale(e.address, countBigInt, reservedFuel, reservedFuelProtocol);
}

export function handleScanned(e: Scanned): void {
  let isV2 = e.block.number.le(ECONOMICS_V2_1_BLOCK);

  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
  let eventInstance = getEvent(e.address);

  // we divide by 1e15 instead of 1e18 for the GET -> OPN migration
  let spentFuel = isV2 ? e.params.getUsed.divDecimal(BIG_DECIMAL_1E15) : BIG_DECIMAL_ZERO;
  let spentFuelProtocol = isV2 ? e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E15) : BIG_DECIMAL_ZERO;

  for (let i = 0; i < count; ++i) {
    let ticketAction = e.params.ticketActions[i];
    let ticket = getTicket(eventInstance.eventIndex, ticketAction.tokenId);

    ticket.isScanned = true;
    ticket.save();

    createUsageEvent(e, i, eventInstance, ticketAction.tokenId, "SCANNED", ticketAction.orderTime);
  }

  protocol.updateScanned(countBigInt, spentFuel, spentFuelProtocol, isV2);
  protocolDay.updateScanned(e, countBigInt, spentFuel, spentFuelProtocol);

  integrator.updateScanned(eventInstance.integrator, countBigInt, spentFuel, spentFuelProtocol, isV2);
  integratorDay.updateScanned(eventInstance.integrator, e, countBigInt);

  event.updateScanned(e.address, countBigInt);
}

export function handleCheckedIn(e: CheckedIn): void {
  let isV2 = e.block.number.le(ECONOMICS_V2_1_BLOCK);

  let holdersRevenue = BIG_DECIMAL_ZERO;
  let treasuryRevenue = BIG_DECIMAL_ZERO;
  let percentageStaking = BIG_DECIMAL_ZERO;
  let percentageTreasury = BIG_DECIMAL_ONE;

  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  // we divide by 1e15 instead of 1e18 for the GET -> OPN migration
  let spentFuel = isV2 ? e.params.getUsed.divDecimal(BIG_DECIMAL_1E15) : BIG_DECIMAL_ZERO;
  let spentFuelProtocol = isV2 ? e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E15) : BIG_DECIMAL_ZERO;
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

  const day = protocolDay.getProtocolDay(e).day;

  //GUTS Tickets has turned into an onCredit integrator on day "GUTS_ON_CREDIT_DAY", without an on chain transaction.
  //This means that all the revenue generated by GUTS Tickets will go to stakers, except for "spentFuelProtocol" from day "GUTS_ON_CREDIT_DAY".
  //onCredit status of GUTS Tickets was set on chain on block number "GUTS_ON_CREDIT_BLOCK".
  if (isV2) {
    const remainder = spentFuel.minus(spentFuelProtocol);
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
  }

  protocol.updateCheckedIn(countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue, isV2);
  protocolDay.updateCheckedIn(e, countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);

  integrator.updateCheckedIn(eventInstance.integrator, countBigInt, isV2, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);
  integratorDay.updateCheckedIn(eventInstance.integrator, e, countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);

  event.updateCheckedIn(e.address, countBigInt);
}

export function handleInvalidated(e: Invalidated): void {
  let isV2 = e.block.number.le(ECONOMICS_V2_1_BLOCK);

  let holdersRevenue = BIG_DECIMAL_ZERO;
  let treasuryRevenue = BIG_DECIMAL_ZERO;
  let percentageStaking = BIG_DECIMAL_ZERO;
  let percentageTreasury = BIG_DECIMAL_ONE;
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  // we divide by 1e15 instead of 1e18 for the GET -> OPN migration
  let spentFuel = isV2 ? e.params.getUsed.divDecimal(BIG_DECIMAL_1E15) : BIG_DECIMAL_ZERO;
  let spentFuelProtocol = isV2 ? e.params.getUsedProtocol.divDecimal(BIG_DECIMAL_1E15) : BIG_DECIMAL_ZERO;
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

  const day = protocolDay.getProtocolDay(e).day;

  //GUTS Tickets has turned into an onCredit integrator on day "GUTS_ON_CREDIT_DAY", without an on chain transaction.
  //This means that all the revenue generated by GUTS Tickets will go to stakers, except for "spentFuelProtocol" from day "GUTS_ON_CREDIT_DAY".
  //onCredit status of GUTS Tickets was set on chain on block number "GUTS_ON_CREDIT_BLOCK".
  if (isV2) {
    const remainder = spentFuel.minus(spentFuelProtocol);
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
  }

  protocol.updateInvalidated(countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue, isV2);
  protocolDay.updateInvalidated(e, countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);

  integrator.updateInvalidated(eventInstance.integrator, countBigInt, isV2, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);
  integratorDay.updateInvalidated(eventInstance.integrator, e, countBigInt, spentFuel, spentFuelProtocol, holdersRevenue, treasuryRevenue);

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

// V2_2 events
export function handlePrimarySaleV2_2(e: PrimarySale1): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  if (countBigInt.equals(BIG_INT_ZERO)) {
    return;
  }

  let reservedFuel = e.params.fuelTokens.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocol = e.params.fuelTokensProtocol.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelUSD = e.params.fuelUSD.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocolUSD = e.params.fuelUSDProtocol.divDecimal(BIG_DECIMAL_1E18);

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
      reservedFuelProtocolPerTicket
    );
  }

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocol.updatePrimarySale(countBigInt, reservedFuel, reservedFuelProtocol, true);
  protocol.updateFuelBalances(reservedFuel, reservedFuelProtocol, reservedFuelUSD, reservedFuelProtocolUSD);

  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);
  protocolDay.updatePrimarySale(e, countBigInt, reservedFuel, reservedFuelProtocol);
  protocolDay.updateFuelBalances(e, reservedFuel, reservedFuelProtocol, reservedFuelUSD, reservedFuelProtocolUSD);

  integrator.updatePrimarySale(eventInstance.integrator, countBigInt, reservedFuel, reservedFuelProtocol);
  integrator.updateFuelBalances(eventInstance.integrator, reservedFuel, reservedFuelProtocol, reservedFuelUSD, reservedFuelProtocolUSD);

  integratorDay.updatePrimarySale(eventInstance.integrator, e, countBigInt, reservedFuel, reservedFuelProtocol);
  integratorDay.updateFuelBalances(
    eventInstance.integrator,
    e,
    reservedFuel,
    reservedFuelProtocol,
    reservedFuelUSD,
    reservedFuelProtocolUSD
  );

  event.updatePrimarySale(e.address, countBigInt, reservedFuel, reservedFuelProtocol);
  event.updateEventUSDBalance(e.address, reservedFuelUSD);
}

export function handleSecondarySaleV2_2(e: SecondarySale1): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  if (countBigInt.equals(BIG_INT_ZERO)) {
    return;
  }

  let reservedFuel = e.params.fuelTokens.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocol = e.params.fuelTokensProtocol.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelUSD = e.params.fuelUSD.divDecimal(BIG_DECIMAL_1E18);
  let reservedFuelProtocolUSD = e.params.fuelUSDProtocol.divDecimal(BIG_DECIMAL_1E18);

  let reservedFuelProtocolPerTicket = reservedFuelProtocol.div(BigDecimal.fromString(countBigInt.toString()));
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
      reservedFuelProtocolPerTicket
    );
  }

  protocol.updateTotalSalesVolume(cumulativeTicketValue);
  protocol.updateSecondarySale(countBigInt, reservedFuel, reservedFuelProtocol, true);
  protocol.updateFuelBalances(reservedFuel, reservedFuelProtocol, reservedFuelUSD, reservedFuelProtocolUSD);

  protocolDay.updateTotalSalesVolume(e, cumulativeTicketValue);
  protocolDay.updateSecondarySale(e, countBigInt, reservedFuel, reservedFuelProtocol);
  protocolDay.updateFuelBalances(e, reservedFuel, reservedFuelProtocol, reservedFuelUSD, reservedFuelProtocolUSD);

  integrator.updateSecondarySale(eventInstance.integrator, countBigInt, reservedFuel, reservedFuelProtocol);
  integrator.updateFuelBalances(eventInstance.integrator, reservedFuel, reservedFuelProtocol, reservedFuelUSD, reservedFuelProtocolUSD);

  integratorDay.updateSecondarySale(eventInstance.integrator, e, countBigInt, reservedFuel, reservedFuelProtocol);
  integratorDay.updateFuelBalances(
    eventInstance.integrator,
    e,
    reservedFuel,
    reservedFuelProtocol,
    reservedFuelUSD,
    reservedFuelProtocolUSD
  );

  event.updateSecondarySale(e.address, countBigInt, reservedFuel, reservedFuelProtocol);
  event.updateEventUSDBalance(e.address, reservedFuelUSD);
}

export function handleClaimedV2_2(e: Claimed1): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);

  if (countBigInt.equals(BIG_INT_ZERO)) {
    return;
  }

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
