import { ToppedUpCustodial, ToppedUpNonCustodial } from "../../../generated/TopUpV2/TopUpV2";
import { BIG_DECIMAL_1E18, BYTES_EMPTY } from "../../constants";
import { getPriceOracle } from "../../entities/priceOracle";
import { createTopUpEvent } from "../../entities/topUpEvent";

export function handleToppedUpCustodial(e: ToppedUpCustodial): void {
  let amount = e.params.amountFuel.divDecimal(BIG_DECIMAL_1E18);
  let price = e.params.price.divDecimal(BIG_DECIMAL_1E18);

  let priceOracle = getPriceOracle();
  priceOracle.lastCustodialSwapPrice = price;
  priceOracle.save();

  createTopUpEvent(e, e.params.integratorIndex.toString(), "CUSTODIAL", amount, price, e.params.externalId);
}

export function handleToppedUpNonCustodial(e: ToppedUpNonCustodial): void {
  let amount = e.params.amountFuel.divDecimal(BIG_DECIMAL_1E18);
  let price = e.params.price.divDecimal(BIG_DECIMAL_1E18);
  createTopUpEvent(e, e.params.integratorIndex.toString(), "NON_CUSTODIAL", amount, price, BYTES_EMPTY);
}
