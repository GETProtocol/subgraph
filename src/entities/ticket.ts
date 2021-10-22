import { BigInt } from "@graphprotocol/graph-ts";
import { Ticket } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BYTES_EMPTY } from "../constants";

export function getTicket(nftIndex: BigInt): Ticket {
  let ticket = Ticket.load(nftIndex.toString());

  if (ticket == null) {
    ticket = new Ticket(nftIndex.toString());
    ticket.createTx = BYTES_EMPTY;
    ticket.relayer = "";
    ticket.event = "";
    ticket.getDebitedFromSilo = BIG_DECIMAL_ZERO;
    ticket.getHeldInFuelTank = BIG_DECIMAL_ZERO;
    ticket.getCreditedToDepot = BIG_DECIMAL_ZERO;
  }

  return ticket as Ticket;
}
