import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { PrimarySale, SecondarySale } from "../../../generated/templates/EventImplementationV2_2/EventImplementation";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_1E3, BIG_DECIMAL_ZERO } from "../../constants";
import {
  calculateReservedFuelPrimary,
  calculateReservedFuelProtocol,
  calculateReservedFuelSecondary,
  createUsageEvent,
  getEvent,
  getTicket,
} from "../../entities";
import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import * as integrator from "../../entities/integrator";
import * as integratorDay from "../../entities/integratorDay";
import * as event from "../../entities/event";

export function handlePrimarySale(e: PrimarySale): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
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

export function handleSecondarySale(e: SecondarySale): void {
  let count = e.params.ticketActions.length;
  let countBigInt = BigInt.fromI32(count);
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
