import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import { FuelDistributed } from "../../../generated/FuelCollector/FuelCollector";
import { BIG_DECIMAL_1E15 } from "../../constants";

export function handleFuelDistributed(e: FuelDistributed): void {
  // divide by 1e15 and not 1e18 for GET -> OPN conversion
  let protocolRevenue = e.params.protocol.divDecimal(BIG_DECIMAL_1E15);
  let treasuryRevenue = e.params.treasury.divDecimal(BIG_DECIMAL_1E15);
  let holdersRevenue = e.params.stakers.divDecimal(BIG_DECIMAL_1E15);

  protocol.updateFuelDistributed(protocolRevenue, treasuryRevenue, holdersRevenue);
  protocolDay.updateFuelDistributed(e, protocolRevenue, treasuryRevenue, holdersRevenue);
}
