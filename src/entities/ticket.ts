import { ethereum } from "@graphprotocol/graph-ts";
import { Ticket } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getTicket(e: ethereum.Event, eventAddress: string): Ticket {
  let ticket = Ticket.load(e.transaction.hash.toHexString());

  if (ticket == null) {
    ticket = new Ticket(e.transaction.hash.toHexString());
    ticket.relayer = e.transaction.from.toHexString();
    ticket.event = eventAddress;
    ticket.fuelTankBalance = BIG_INT_ZERO;
    ticket.url = "";
    ticket.state = "UNSCANNED";
  }

  return ticket as Ticket;
}
