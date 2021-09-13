import { Relayer } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getRelayer(id: string): Relayer {
  let relayer = Relayer.load(id);

  if (relayer == null) {
    relayer = new Relayer(id.toString());
    relayer.getUsed = BIG_INT_ZERO;
    relayer.ticketValue = BIG_INT_ZERO;
    relayer.mintCount = BIG_INT_ZERO;
    relayer.scanCount = BIG_INT_ZERO;
    relayer.claimCount = BIG_INT_ZERO;
    relayer.events = [];
  }

  return relayer as Relayer;
}
