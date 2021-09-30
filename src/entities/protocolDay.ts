import { ethereum } from "@graphprotocol/graph-ts";
import { ProtocolDay } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getProtocolDayByEvent(event: ethereum.Event): ProtocolDay {
  let day = event.block.timestamp.toI32() / 86400;
  let date = day * 86400;

  let id = date;

  let protocolDay = ProtocolDay.load(id.toString());

  if (protocolDay == null) {
    protocolDay = new ProtocolDay(id.toString());
    protocolDay.timestamp = date;
    protocolDay.getUsed = BIG_INT_ZERO;
    protocolDay.mintCount = BIG_INT_ZERO;
    protocolDay.scanCount = BIG_INT_ZERO;
    protocolDay.claimCount = BIG_INT_ZERO;
  }

  return protocolDay as ProtocolDay;
}
