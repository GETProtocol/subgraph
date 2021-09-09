import { ethereum } from "@graphprotocol/graph-ts";
import { ProtocolDay } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getProtocolDay(event: ethereum.Event): ProtocolDay {
  const day = event.block.timestamp.toI32() / 86400;
  const date = day * 86400;

  const id = date;

  let protocolDay = ProtocolDay.load(id.toString());

  if (protocolDay == null) {
    protocolDay = new ProtocolDay(id.toString());
    protocolDay.timestamp = date;
    protocolDay.fuel_used = BIG_INT_ZERO;
    protocolDay.mints = BIG_INT_ZERO;
    protocolDay.ticket_value = BIG_INT_ZERO;
    protocolDay.scans = BIG_INT_ZERO;
    protocolDay.claims = BIG_INT_ZERO;
  }

  return protocolDay;
}
