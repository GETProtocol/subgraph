import { UpdatePrice } from "../../../generated/PriceOracleV2/PriceOracleV2";
import { BIG_DECIMAL_1E15 } from "../../constants";
import { getPriceOracle } from "../../entities/priceOracle";

export function handleUpdatePrice(e: UpdatePrice): void {
  let priceOracle = getPriceOracle();
  // we divide by 1e15 instead of 1e18 for GET -> OPN migration
  priceOracle.price = e.params.updated.divDecimal(BIG_DECIMAL_1E15);
  priceOracle.lastUpdateTimestamp = e.block.timestamp;
  priceOracle.lastUpdateTx = e.transaction.hash;
  priceOracle.save();
}
