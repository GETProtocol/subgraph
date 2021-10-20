import { ethereum } from "@graphprotocol/graph-ts";
import { ProtocolDay } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getProtocolDay(e: ethereum.Event): ProtocolDay {
  let day = e.block.timestamp.toI32() / 86400;
  let id = day;
  let protocolDay = ProtocolDay.load(id.toString());

  if (protocolDay == null) {
    protocolDay = new ProtocolDay(id.toString());
    protocolDay.day = day;
    protocolDay.getDebitedFromSilos = BIG_DECIMAL_ZERO;
    protocolDay.getCreditedToDepot = BIG_DECIMAL_ZERO;
    protocolDay.getMovedToFeeCollector = BIG_DECIMAL_ZERO;
    protocolDay.averageGetPerMint = BIG_DECIMAL_ZERO;
    protocolDay.mintCount = BIG_INT_ZERO;
    protocolDay.scanCount = BIG_INT_ZERO;
    protocolDay.invalidateCount = BIG_INT_ZERO;
    protocolDay.checkInCount = BIG_INT_ZERO;
    protocolDay.claimCount = BIG_INT_ZERO;
  }

  return protocolDay as ProtocolDay;
}
