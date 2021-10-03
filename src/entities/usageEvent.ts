import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Event, UsageEvent } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getUsageEvent(e: ethereum.Event): UsageEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;

  let usageEvent = new UsageEvent(e.transaction.hash.toHexString());
  usageEvent.relayer = e.transaction.from.toHexString();

  usageEvent.blockNumber = e.block.number;
  usageEvent.blockTimestamp = timestamp;
  usageEvent.orderTime = BIG_INT_ZERO;
  usageEvent.day = day;
  usageEvent.getUsed = BIG_INT_ZERO;
  usageEvent.event = "";
  usageEvent.nftIndex = BIG_INT_ZERO;
  usageEvent.interaction = "";
  usageEvent.latitude = BIG_DECIMAL_ZERO;
  usageEvent.longitude = BIG_DECIMAL_ZERO;

  return usageEvent as UsageEvent;
}

export function createUsageEvent(
  e: ethereum.Event,
  event: Event,
  nftIndex: BigInt,
  interaction: string,
  orderTime: BigInt,
  getUsed: BigInt
): UsageEvent {
  let usageEvent = getUsageEvent(e);

  usageEvent.orderTime = orderTime;
  usageEvent.getUsed = getUsed;
  usageEvent.nftIndex = nftIndex;
  usageEvent.interaction = interaction;
  if (event) {
    usageEvent.event = event.id;
    usageEvent.latitude = event.latitude;
    usageEvent.longitude = event.longitude;
  } else {
    usageEvent.event = "";
    usageEvent.latitude = BIG_DECIMAL_ZERO;
    usageEvent.longitude = BIG_DECIMAL_ZERO;
  }

  usageEvent.save();
  return usageEvent as UsageEvent;
}
