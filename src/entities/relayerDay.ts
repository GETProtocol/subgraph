import { ethereum } from "@graphprotocol/graph-ts";
import { RelayerDay } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getRelayerDay(e: ethereum.Event): RelayerDay {
  let relayerAddress = e.transaction.from.toHexString();
  let day = e.block.timestamp.toI32() / 86400;
  let id = relayerAddress.concat("-").concat(day.toString());
  let relayerDay = RelayerDay.load(id);

  if (relayerDay == null) {
    relayerDay = new RelayerDay(id);
    relayerDay.relayer = relayerAddress;
    relayerDay.day = day;
    relayerDay.getDebitedFromSilo = BIG_INT_ZERO;
    relayerDay.getCreditedToDepot = BIG_INT_ZERO;
    relayerDay.averageGetPerMint = BIG_DECIMAL_ZERO;
    relayerDay.mintCount = BIG_INT_ZERO;
    relayerDay.scanCount = BIG_INT_ZERO;
    relayerDay.invalidateCount = BIG_INT_ZERO;
    relayerDay.checkInCount = BIG_INT_ZERO;
    relayerDay.claimCount = BIG_INT_ZERO;
  }

  return relayerDay as RelayerDay;
}
