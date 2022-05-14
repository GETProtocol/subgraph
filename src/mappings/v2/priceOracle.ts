import { UpdatePrice } from "../../../generated/PriceOracleV2/PriceOracleV2";
import { BIG_DECIMAL_1E18 } from "../../constants";
import { getPriceOracle } from "../../entities/priceOracle";

export function handleUpdatePrice(e: UpdatePrice): void {
  let priceOracle = getPriceOracle();
  priceOracle.price = e.params.updated.divDecimal(BIG_DECIMAL_1E18);
  priceOracle.lastUpdateTimestamp = e.block.timestamp;
  priceOracle.lastUpdateTx = e.transaction.hash;
  priceOracle.save();
}
