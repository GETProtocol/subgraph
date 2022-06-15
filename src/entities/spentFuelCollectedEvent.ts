import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { SpentFuelCollectedEvent, SpentFuelRecipient } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BYTES_EMPTY } from "../constants";

export function getSpentFuelCollectedEvent(e: ethereum.Event): SpentFuelCollectedEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;
  let id = e.transaction.hash.toHexString() + "-" + e.logIndex.toString();

  let spentFuelCollectedEvent = new SpentFuelCollectedEvent(id);
  spentFuelCollectedEvent.txHash = e.transaction.hash;
  spentFuelCollectedEvent.blockNumber = e.block.number;
  spentFuelCollectedEvent.blockTimestamp = timestamp;
  spentFuelCollectedEvent.day = day;
  spentFuelCollectedEvent.recipient = "";
  spentFuelCollectedEvent.recipientAddress = BYTES_EMPTY;
  spentFuelCollectedEvent.recipientLabel = "";
  spentFuelCollectedEvent.recipientPercentage = BIG_DECIMAL_ZERO;
  spentFuelCollectedEvent.amount = BIG_DECIMAL_ZERO;
  spentFuelCollectedEvent.totalAmountCollected = BIG_DECIMAL_ZERO;

  return spentFuelCollectedEvent as SpentFuelCollectedEvent;
}

export function createSpentFuelCollectedEvent(
  e: ethereum.Event,
  recipient: SpentFuelRecipient,
  recipientAddress: Address,
  amount: BigDecimal,
  totalAmountCollected: BigDecimal
): SpentFuelCollectedEvent {
  let spentFuelCollectedEvent = getSpentFuelCollectedEvent(e);

  spentFuelCollectedEvent.recipient = recipient.id;
  spentFuelCollectedEvent.recipientAddress = recipientAddress;
  spentFuelCollectedEvent.recipientLabel = recipient.label;
  spentFuelCollectedEvent.recipientPercentage = recipient.percentage;
  spentFuelCollectedEvent.amount = amount;
  spentFuelCollectedEvent.totalAmountCollected = totalAmountCollected;

  spentFuelCollectedEvent.save();
  return spentFuelCollectedEvent as SpentFuelCollectedEvent;
}
