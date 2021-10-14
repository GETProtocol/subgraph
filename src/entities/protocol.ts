import { Protocol } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../constants";

export function getProtocol(): Protocol {
  let id = "1";

  let protocol = Protocol.load(id);

  if (protocol == null) {
    protocol = new Protocol(id.toString());
    protocol.getDebitedFromSilos = BIG_INT_ZERO;
    protocol.getCreditedToDepot = BIG_INT_ZERO;
    protocol.getMovedToFeeCollector = BIG_INT_ZERO;
    protocol.averageGetPerMint = BIG_DECIMAL_ZERO;
    protocol.mintCount = BIG_INT_ZERO;
    protocol.scanCount = BIG_INT_ZERO;
    protocol.invalidateCount = BIG_INT_ZERO;
    protocol.checkInCount = BIG_INT_ZERO;
    protocol.claimCount = BIG_INT_ZERO;
  }

  return protocol as Protocol;
}
