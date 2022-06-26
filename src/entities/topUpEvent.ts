import { BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { TopUpEvent } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY } from "../constants";
import { getIntegrator } from "./integrator";
import { getProtocol } from "./protocol";

export function getTopUpEvent(integratorIndex: string, e: ethereum.Event): TopUpEvent {
  let timestamp = e.block.timestamp;
  let day = timestamp.toI32() / 86400;
  let id = e.transaction.hash.toHexString();
  let topUpEvent = TopUpEvent.load(id);

  if (topUpEvent == null) {
    topUpEvent = new TopUpEvent(id);
    topUpEvent.txHash = e.transaction.hash;
    topUpEvent.invoiceNumber = BIG_INT_ZERO;
    topUpEvent.integrator = integratorIndex.toString();
    topUpEvent.integratorIndex = integratorIndex;
    topUpEvent.blockNumber = e.block.number;
    topUpEvent.blockTimestamp = timestamp;
    topUpEvent.type = "NON_CUSTODIAL";
    topUpEvent.day = day;
    topUpEvent.total = BIG_DECIMAL_ZERO;
    topUpEvent.totalUsd = BIG_DECIMAL_ZERO;
    topUpEvent.salesTaxRate = BIG_DECIMAL_ZERO;
    topUpEvent.salesTax = BIG_DECIMAL_ZERO;
    topUpEvent.price = BIG_DECIMAL_ZERO;
    topUpEvent.externalId = BYTES_EMPTY;
  }

  return topUpEvent as TopUpEvent;
}

export function createTopUpEvent(
  e: ethereum.Event,
  integratorIndex: string,
  total: BigDecimal,
  salesTax: BigDecimal,
  price: BigDecimal,
  externalId: Bytes = BYTES_EMPTY
): TopUpEvent {
  let protocol = getProtocol();
  let topUpEvent = getTopUpEvent(integratorIndex, e);
  let integrator = getIntegrator(integratorIndex);

  topUpEvent.invoiceNumber = protocol.topUpCount;
  topUpEvent.salesTaxRate = integrator.salesTaxRate;
  topUpEvent.salesTax = salesTax;
  topUpEvent.externalId = externalId;
  topUpEvent.total = total;
  topUpEvent.price = price;
  topUpEvent.totalUsd = total.times(price).truncate(18);

  topUpEvent.save();
  return topUpEvent as TopUpEvent;
}

export function setTopUpEventType(e: ethereum.Event, integratorIndex: string, type: string): void {
  let topUpEvent = getTopUpEvent(integratorIndex, e);
  topUpEvent.type = type;
  topUpEvent.save();
}
