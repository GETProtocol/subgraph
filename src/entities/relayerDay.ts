import { ethereum } from "@graphprotocol/graph-ts";
import { RelayerDay } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getRelayerDayByEvent(event: ethereum.Event): RelayerDay {
  let relayerAddress = event.transaction.from.toHex();

  let day = event.block.timestamp.toI32() / 86400;
  let date = day * 86400;

  let id = relayerAddress.concat("-").concat(date.toString());

  let relayerDay = RelayerDay.load(id);

  if (relayerDay == null) {
    relayerDay = new RelayerDay(id);
    relayerDay.relayer = relayerAddress;
    relayerDay.timestamp = date;
    relayerDay.getUsed = BIG_INT_ZERO;
    relayerDay.mintCount = BIG_INT_ZERO;
    relayerDay.scanCount = BIG_INT_ZERO;
    relayerDay.claimCount = BIG_INT_ZERO;
  }

  return relayerDay as RelayerDay;
}
