import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { TopUpEvent } from "../../generated/schema";

export function getTopUpEvent(relayerAddress: Address, e: ethereum.Event): TopUpEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;
  let id = e.transaction.hash.toHexString() + "-" + e.logIndex.toString();

  let topUpEvent = new TopUpEvent(id);
  topUpEvent.txHash = e.transaction.hash;
  topUpEvent.relayer = relayerAddress.toHexString();
  topUpEvent.relayerAddress = relayerAddress;
  topUpEvent.blockNumber = e.block.number;
  topUpEvent.blockTimestamp = timestamp;
  topUpEvent.day = day;

  return topUpEvent as TopUpEvent;
}

export function createTopUpEvent(
  e: ethereum.Event,
  relayerAddress: Address,
  amount: BigDecimal,
  price: BigDecimal
): TopUpEvent {
  let topUpEvent = getTopUpEvent(relayerAddress, e);

  topUpEvent.amount = amount;
  topUpEvent.price = price;

  topUpEvent.save();
  return topUpEvent as TopUpEvent;
}
