import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import { FuelDistributed } from "../../../generated/FuelCollector/FuelCollector";
import { BIG_DECIMAL_1E15, BIG_DECIMAL_1E18 } from "../../constants";
import { isV2_2 } from "../v2.2/utils";

export function handleFuelDistributed(e: FuelDistributed): void {
  // if v2_2, divide by 1e18 and if not divide by 1e15 for the GET -> OPN migration
  let protocolRevenue = e.params.protocol.divDecimal(isV2_2(e.block.number) ? BIG_DECIMAL_1E18 : BIG_DECIMAL_1E15);
  let treasuryRevenue = e.params.treasury.divDecimal(isV2_2(e.block.number) ? BIG_DECIMAL_1E18 : BIG_DECIMAL_1E15);
  let holdersRevenue = e.params.stakers.divDecimal(isV2_2(e.block.number) ? BIG_DECIMAL_1E18 : BIG_DECIMAL_1E15);

  protocol.updateFuelDistributed(protocolRevenue, treasuryRevenue, holdersRevenue);
  protocolDay.updateFuelDistributed(e, protocolRevenue, treasuryRevenue, holdersRevenue);
}
