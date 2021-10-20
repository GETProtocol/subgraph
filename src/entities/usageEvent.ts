import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Event, UsageEvent } from "../../generated/schema";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getUsageEvent(e: ethereum.Event): UsageEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;
  let id = e.transaction.hash.toHex() + "-" + e.logIndex.toString();

  let usageEvent = new UsageEvent(id);
  usageEvent.txHash = e.transaction.hash;
  usageEvent.relayer = e.transaction.from.toHexString();
  usageEvent.blockNumber = e.block.number;
  usageEvent.blockTimestamp = timestamp;
  usageEvent.orderTime = BIG_INT_ZERO;
  usageEvent.day = day;
  usageEvent.getDebitedFromSilo = BIG_DECIMAL_ZERO;
  usageEvent.getCreditedToDepot = BIG_DECIMAL_ZERO;
  usageEvent.event = "";
  usageEvent.nftIndex = BIG_INT_ZERO;
  usageEvent.type = "";
  usageEvent.latitude = BIG_DECIMAL_ZERO;
  usageEvent.longitude = BIG_DECIMAL_ZERO;

  return usageEvent as UsageEvent;
}

export function createUsageEvent(
  e: ethereum.Event,
  event: Event,
  nftIndex: BigInt,
  type: string,
  orderTime: BigInt,
  getUsed: BigInt
): UsageEvent {
  let usageEvent = getUsageEvent(e);

  usageEvent.orderTime = orderTime;
  usageEvent.nftIndex = nftIndex;
  usageEvent.type = type;

  if (event) {
    usageEvent.event = event.id;
    usageEvent.latitude = event.latitude;
    usageEvent.longitude = event.longitude;
  }

  if (type == "MINT") {
    usageEvent.getDebitedFromSilo = getUsed.divDecimal(BIG_DECIMAL_1E18);
  } else if (type == "INVALIDATE" || type == "SCAN" || type == "CHECK_IN") {
    usageEvent.getCreditedToDepot = getUsed.divDecimal(BIG_DECIMAL_1E18);
  }

  usageEvent.save();
  return usageEvent as UsageEvent;
}
