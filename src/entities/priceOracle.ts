import { PriceOracle } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, BYTES_EMPTY } from "../constants";

export function getPriceOracle(): PriceOracle {
  let id = "1";
  let priceOracle = PriceOracle.load(id);

  if (priceOracle == null) {
    priceOracle = new PriceOracle(id);
    priceOracle.price = BIG_DECIMAL_ZERO;
    priceOracle.lastUpdateTimestamp = BIG_INT_ZERO;
    priceOracle.lastUpdateTx = BYTES_EMPTY;
    priceOracle.lastCustodialSwapPrice = BIG_DECIMAL_ZERO;
  }

  return priceOracle as PriceOracle;
}
