import { ethereum } from "@graphprotocol/graph-ts";
import { Ticket } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getTicket(event: ethereum.Event, eventAddress: string): Ticket {
  let ticket = Ticket.load(event.transaction.hash.toHex());

  if (ticket == null) {
    ticket = new Ticket(event.transaction.hash.toHex());
    ticket.relayer = event.transaction.from.toHex();
    ticket.event = eventAddress;
    ticket.fuelTankBalance = BIG_INT_ZERO;
    ticket.url = "";
    ticket.state = "UNSCANNED";
  }

  return ticket as Ticket;
}
