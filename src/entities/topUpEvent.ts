import { BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { TopUpEvent } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BYTES_EMPTY } from "../constants";

export function getTopUpEvent(integratorIndex: string, e: ethereum.Event): TopUpEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;
  let id = e.transaction.hash.toHexString() + "-" + e.logIndex.toString();

  let topUpEvent = new TopUpEvent(id);
  topUpEvent.txHash = e.transaction.hash;
  topUpEvent.integrator = integratorIndex.toString();
  topUpEvent.integratorIndex = integratorIndex;
  topUpEvent.blockNumber = e.block.number;
  topUpEvent.blockTimestamp = timestamp;
  topUpEvent.type = "NON_CUSTODIAL";
  topUpEvent.day = day;
  topUpEvent.amount = BIG_DECIMAL_ZERO;
  topUpEvent.price = BIG_DECIMAL_ZERO;
  topUpEvent.externalId = BYTES_EMPTY;

  return topUpEvent as TopUpEvent;
}

export function createTopUpEvent(
  e: ethereum.Event,
  integratorIndex: string,
  type: string,
  amount: BigDecimal,
  price: BigDecimal,
  externalId: Bytes
): TopUpEvent {
  let topUpEvent = getTopUpEvent(integratorIndex, e);

  topUpEvent.amount = amount;
  topUpEvent.price = price;
  topUpEvent.type = type;
  topUpEvent.externalId = externalId;

  topUpEvent.save();
  return topUpEvent as TopUpEvent;
}
