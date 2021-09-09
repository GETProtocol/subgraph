import { Protocol } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function getProtocol(): Protocol {
  const id = "0001";

  let protocol = Protocol.load(id);

  if (protocol == null) {
    protocol = new Protocol(id.toString());
    protocol.fuel_used = BIG_INT_ZERO;
    protocol.mints = BIG_INT_ZERO;
    protocol.ticket_value = BIG_INT_ZERO;
    protocol.scans = BIG_INT_ZERO;
    protocol.claims = BIG_INT_ZERO;
  }

  return protocol;
}
