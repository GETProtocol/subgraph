import { ethereum } from "@graphprotocol/graph-ts";
import { Relayer } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getRelayer(e: ethereum.Event): Relayer {
  let id = e.transaction.from.toHexString();
  let relayer = Relayer.load(id);

  if (relayer == null) {
    relayer = new Relayer(id);
    relayer.getDebitedFromSilo = BIG_DECIMAL_ZERO;
    relayer.getHeldInFuelTanks = BIG_DECIMAL_ZERO;
    relayer.getCreditedToDepot = BIG_DECIMAL_ZERO;
    relayer.averageGetPerMint = BIG_DECIMAL_ZERO;
    relayer.mintCount = BIG_INT_ZERO;
    relayer.invalidateCount = BIG_INT_ZERO;
    relayer.resaleCount = BIG_INT_ZERO;
    relayer.scanCount = BIG_INT_ZERO;
    relayer.checkInCount = BIG_INT_ZERO;
    relayer.claimCount = BIG_INT_ZERO;
  }

  return relayer as Relayer;
}
