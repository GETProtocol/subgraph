import { BigDecimal, BigInt, ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Event, UsageEvent } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY, CHAIN_NAME, FUEL_ACTIVATED_BLOCK } from "../constants";

export function getUsageEvent(e: ethereum.Event, itemIndex: number): UsageEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;
  let id = e.transaction.hash.toHexString() + "-" + e.logIndex.toString() + "-" + itemIndex.toString();

  let usageEvent = new UsageEvent(id);
  usageEvent.txHash = e.transaction.hash;
  usageEvent.integrator = "";
  usageEvent.integratorIndex = "0";
  usageEvent.relayer = e.transaction.from.toHexString();
  usageEvent.relayerAddress = e.transaction.from;
  usageEvent.blockNumber = e.block.number;
  usageEvent.blockTimestamp = timestamp;
  usageEvent.orderTime = BIG_INT_ZERO;
  usageEvent.price = BIG_DECIMAL_ZERO;
  usageEvent.day = day;
  usageEvent.getUsed = BIG_DECIMAL_ZERO;
  usageEvent.getUsedProtocol = BIG_DECIMAL_ZERO;
  usageEvent.event = "";
  usageEvent.eventIndex = BIG_INT_ZERO;
  usageEvent.eventAddress = BYTES_EMPTY;
  usageEvent.ticket = "";
  usageEvent.tokenId = BIG_INT_ZERO;
  usageEvent.type = "";
  usageEvent.latitude = BIG_DECIMAL_ZERO;
  usageEvent.longitude = BIG_DECIMAL_ZERO;

  return usageEvent as UsageEvent;
}

export function createUsageEvent(
  e: ethereum.Event,
  itemIndex: number,
  event: Event,
  tokenId: BigInt,
  type: string,
  orderTime: BigInt,
  price: BigDecimal = BIG_DECIMAL_ZERO,
  getUsed: BigDecimal = BIG_DECIMAL_ZERO,
  getUsedProtocol: BigDecimal = BIG_DECIMAL_ZERO
): UsageEvent {
  let usageEvent = getUsageEvent(e, itemIndex);
  let nftId = `${CHAIN_NAME}-${event.eventIndex.toString()}-${tokenId.toString()}`;

  usageEvent.orderTime = orderTime;
  usageEvent.price = price;
  usageEvent.ticket = nftId;
  usageEvent.nftId = nftId;
  usageEvent.tokenId = tokenId;
  usageEvent.type = type;

  if (event) {
    usageEvent.event = event.id;
    usageEvent.eventIndex = event.eventIndex;
    usageEvent.eventAddress = Bytes.fromByteArray(ByteArray.fromHexString(event.id));
    usageEvent.latitude = event.latitude;
    usageEvent.longitude = event.longitude;
    usageEvent.integrator = event.integrator;
    usageEvent.integratorIndex = event.integrator;
  }

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    usageEvent.getUsed = getUsed;
    usageEvent.getUsedProtocol = getUsedProtocol;
  }

  usageEvent.save();
  return usageEvent as UsageEvent;
}
