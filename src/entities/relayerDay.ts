import { Address, ethereum } from "@graphprotocol/graph-ts";
import { RelayerDay } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

function findOrBuildRelayerDay(address: Address, e: ethereum.Event): RelayerDay {
  let relayerAddress = address.toHexString();
  let day = e.block.timestamp.toI32() / 86400;
  let id = relayerAddress.concat("-").concat(day.toString());
  let relayerDay = RelayerDay.load(id);

  if (relayerDay == null) {
    relayerDay = new RelayerDay(id);
    relayerDay.relayer = relayerAddress;
    relayerDay.day = day;
    relayerDay.getDebitedFromSilo = BIG_DECIMAL_ZERO;
    relayerDay.getCreditedToDepot = BIG_DECIMAL_ZERO;
    relayerDay.averageGetPerMint = BIG_DECIMAL_ZERO;
    relayerDay.siloBalance = BIG_DECIMAL_ZERO;
    relayerDay.basePrice = BIG_DECIMAL_ZERO;
    relayerDay.mintCount = BIG_INT_ZERO;
    relayerDay.invalidateCount = BIG_INT_ZERO;
    relayerDay.resaleCount = BIG_INT_ZERO;
    relayerDay.scanCount = BIG_INT_ZERO;
    relayerDay.checkInCount = BIG_INT_ZERO;
    relayerDay.claimCount = BIG_INT_ZERO;
  }

  return relayerDay as RelayerDay;
}

export function getRelayerDay(e: ethereum.Event): RelayerDay {
  return findOrBuildRelayerDay(e.transaction.from, e) as RelayerDay;
}

export function getRelayerDayByAddress(address: Address, e: ethereum.Event): RelayerDay {
  return findOrBuildRelayerDay(address, e) as RelayerDay;
}
