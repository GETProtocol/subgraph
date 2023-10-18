import { BigDecimal } from "@graphprotocol/graph-ts";
import { Claimed } from "../../../generated/DripCollector/DripCollector";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_ONE, BIG_DECIMAL_ZERO, FUEL_BRIDGE_RECEIVER, GET_SAAS, STAKING } from "../../constants";

import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import { getSpentFuelRecipientPercentage } from "../../entities";

export function handleClaimed(e: Claimed): void {
  let holdersRevenue: BigDecimal;
  let treasuryRevenue: BigDecimal;
  let percentageStaking = BIG_DECIMAL_ZERO;
  let percentageTreasury = BIG_DECIMAL_ONE;

  let amount = e.params.amount.divDecimal(BIG_DECIMAL_1E18);

  let percentageEthStaking = getSpentFuelRecipientPercentage(FUEL_BRIDGE_RECEIVER);
  let percentagePolyStaking = getSpentFuelRecipientPercentage(STAKING);
  percentageTreasury = getSpentFuelRecipientPercentage(GET_SAAS);
  percentageStaking = percentageEthStaking.plus(percentagePolyStaking);

  treasuryRevenue = amount.times(percentageTreasury);
  holdersRevenue = amount.times(percentageStaking);

  protocol.updateFuelClaimed(amount, treasuryRevenue, holdersRevenue);
  protocolDay.updateFuelClaimed(e, amount, treasuryRevenue, holdersRevenue);
}
