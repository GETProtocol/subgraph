import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import { UsageEvent } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getUsageEvent(event: ethereum.Event, nftIndex: BigInt = BIG_INT_ZERO): UsageEvent {
  let day = event.block.timestamp.toI32() / 86400;
  let date = day * 86400;

  let usageEvent = new UsageEvent(event.transaction.hash.toHex());
  usageEvent.getUsed = BIG_INT_ZERO;
  usageEvent.relayer = event.transaction.from.toHex();
  usageEvent.nftIndex = nftIndex;
  usageEvent.interaction = "";
  usageEvent.timestamp = date;

  return usageEvent as UsageEvent;
}
