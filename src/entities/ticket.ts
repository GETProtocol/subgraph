import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Event, Ticket } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BYTES_EMPTY, CHAIN_NAME } from "../constants";

export function getTicket(eventIndex: BigInt, tokenId: BigInt): Ticket {
  let nftId = `${CHAIN_NAME}-${eventIndex.toString()}-${tokenId.toString()}`;
  let ticket = Ticket.load(nftId);

  if (ticket == null) {
    ticket = new Ticket(nftId);
    ticket.tokenId = tokenId;
    ticket.createTx = BYTES_EMPTY;
    ticket.event = "";
    ticket.integrator = "";
    ticket.relayer = "";
    ticket.basePrice = BIG_DECIMAL_ZERO;
    ticket.reservedFuel = BIG_DECIMAL_ZERO;
    ticket.isScanned = false;
    ticket.isCheckedIn = false;
    ticket.isInvalidated = false;
    ticket.isClaimed = false;
  }

  return ticket as Ticket;
}

export function getTicketByAddress(eventAddress: Address, tokenId: BigInt): Ticket {
  let event = Event.load(eventAddress.toHexString());
  return getTicket(event.eventIndex, tokenId);
}
