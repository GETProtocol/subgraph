import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Integrator, Ticket } from "../../generated/schema";
import { ADDRESS_ZERO, BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY, CHAIN_NAME } from "../constants";
import { getProtocol } from "./protocol";

export function getTicket(eventIndex: BigInt, tokenId: BigInt): Ticket {
  let nftId = `${CHAIN_NAME}-${eventIndex.toString()}-${tokenId.toString()}`;
  let ticket = Ticket.load(nftId);

  if (ticket == null) {
    ticket = new Ticket(nftId);
    ticket.tokenId = tokenId;
    ticket.createTx = BYTES_EMPTY;
    ticket.blockNumber = BIG_INT_ZERO;
    ticket.blockTimestamp = BIG_INT_ZERO;
    ticket.event = "";
    ticket.owner = ADDRESS_ZERO;
    ticket.integrator = "";
    ticket.relayer = "";
    ticket.basePrice = BIG_DECIMAL_ZERO;
    ticket.reservedFuel = BIG_DECIMAL_ZERO;
    ticket.reservedFuelProtocol = BIG_DECIMAL_ZERO;
    ticket.isScanned = false;
    ticket.isCheckedIn = false;
    ticket.isInvalidated = false;
    ticket.isClaimed = false;
  }

  return ticket as Ticket;
}

function calculateReservedFuel(
  basePrice: BigDecimal,
  minFee: BigDecimal,
  maxFee: BigDecimal,
  rate: BigDecimal,
  price: BigDecimal
): BigDecimal {
  // The reserved fuel per-ticket is not emitted in the events for efficiency. Here we replicate the calculation made
  // in Economics.sol for the reservedFuel on the Ticket entity. Minute differences may occur due to using BigDecimal
  // rather than BigInt. There should be no differences on other entities as they use the reservedFuel from the event.
  //
  // From get-protocol-core: https://github.com/GETProtocol/get-protocol-core/blob/release/contracts/Economics.sol#L179
  //
  // uint256 _fuelUsd = uint256(_ticketActions[i].basePrice) * _product.rate * 1e9;
  // if (_fuelUsd < _min) {
  //     _fuel += (_min * 1e18) / integrator.price;
  // } else if (_fuelUsd > _max && _max != 0) {
  //     _fuel += (_max * 1e18) / integrator.price;
  // } else {
  //     _fuel += (_fuelUsd * 1e18) / integrator.price;
  // }

  if (price.equals(BIG_DECIMAL_ZERO)) return BIG_DECIMAL_ZERO;

  let fuelUsd = basePrice.times(rate).div(BigDecimal.fromString("100"));

  if (fuelUsd.lt(minFee)) {
    return minFee.div(price);
  } else if (fuelUsd.gt(maxFee) && maxFee.notEqual(BIG_DECIMAL_ZERO)) {
    return maxFee.div(price);
  } else {
    return fuelUsd.div(price);
  }
}

export function calculateReservedFuelPrimary(ticket: Ticket, integrator: Integrator): BigDecimal {
  return calculateReservedFuel(
    ticket.basePrice,
    integrator.minFeePrimary,
    integrator.maxFeePrimary,
    integrator.primaryRate,
    integrator.price
  );
}

export function calculateReservedFuelSecondary(ticket: Ticket, integrator: Integrator): BigDecimal {
  return calculateReservedFuel(
    ticket.basePrice,
    integrator.minFeeSecondary,
    integrator.maxFeeSecondary,
    integrator.secondaryRate,
    integrator.price
  );
}

// The _ticket parameter is unused for now, but only because fee is fixed at the protocol level.
// This may change to be ticket-specific in future.
export function calculateReservedFuelProtocol(_ticket: Ticket, integrator: Integrator): BigDecimal {
  let protocol = getProtocol();
  if (integrator.price.equals(BIG_DECIMAL_ZERO)) return BIG_DECIMAL_ZERO;
  return protocol.minFeePrimary.div(integrator.price);
}
