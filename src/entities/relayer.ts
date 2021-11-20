import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Relayer } from "../../generated/schema";
import { ADDRESS_ZERO, BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

function findOrBuildRelayer(address: Address): Relayer {
  let id = address.toHexString();
  let relayer = Relayer.load(id);

  if (relayer == null) {
    relayer = new Relayer(id);
    relayer.getDebitedFromSilo = BIG_DECIMAL_ZERO;
    relayer.getHeldInFuelTanks = BIG_DECIMAL_ZERO;
    relayer.getCreditedToDepot = BIG_DECIMAL_ZERO;
    relayer.averageGetPerMint = BIG_DECIMAL_ZERO;
    relayer.siloBalance = BIG_DECIMAL_ZERO;
    relayer.basePrice = BIG_DECIMAL_ZERO;
    relayer.bufferAddress = ADDRESS_ZERO;
    relayer.mintCount = BIG_INT_ZERO;
    relayer.invalidateCount = BIG_INT_ZERO;
    relayer.resaleCount = BIG_INT_ZERO;
    relayer.scanCount = BIG_INT_ZERO;
    relayer.checkInCount = BIG_INT_ZERO;
    relayer.claimCount = BIG_INT_ZERO;
  }

  return relayer as Relayer;
}

export function getRelayer(e: ethereum.Event): Relayer {
  return findOrBuildRelayer(e.transaction.from) as Relayer;
}

export function getRelayerByAddress(address: Address): Relayer {
  return findOrBuildRelayer(address) as Relayer;
}
