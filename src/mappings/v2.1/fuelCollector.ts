import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import { FuelDistributed } from "../../../generated/FuelCollector/FuelCollector";
import { BIG_DECIMAL_1E18 } from "../../constants";

export function handleFuelDistributed(e: FuelDistributed): void {
  let protocolRevenue = e.params.protocol.divDecimal(BIG_DECIMAL_1E18);
  let treasuryRevenue = e.params.treasury.divDecimal(BIG_DECIMAL_1E18);
  let holdersRevenue = e.params.stakers.divDecimal(BIG_DECIMAL_1E18);

  protocol.updateFuelDistributed(protocolRevenue, treasuryRevenue, holdersRevenue);
  protocolDay.updateFuelDistributed(e, protocolRevenue, treasuryRevenue, holdersRevenue);
}
