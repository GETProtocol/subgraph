import { ToppedUpCustodial, ToppedUpNonCustodial } from "../../../generated/TopUpV2/TopUpV2";
import { BIG_DECIMAL_1E15 } from "../../constants";
import { getPriceOracle } from "../../entities/priceOracle";
import { setTopUpEventType } from "../../entities/topUpEvent";

export function handleToppedUpCustodial(e: ToppedUpCustodial): void {
  // we divide by 1e15 instead of 1e18 for GET -> OPN migration
  let price = e.params.price.divDecimal(BIG_DECIMAL_1E15);

  let priceOracle = getPriceOracle();
  priceOracle.lastCustodialSwapPrice = price;
  priceOracle.save();

  setTopUpEventType(e, e.params.integratorIndex.toString(), "CUSTODIAL");
}

export function handleToppedUpNonCustodial(e: ToppedUpNonCustodial): void {
  setTopUpEventType(e, e.params.integratorIndex.toString(), "NON_CUSTODIAL");
}
