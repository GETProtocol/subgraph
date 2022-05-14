import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  UpdateFeeCollector,
  UpdateGETUSD,
} from "../../../generated/GETProtocolConfigurationV2V1_1/GETProtocolConfigurationV2V1_1";
import { BIG_DECIMAL_1E3, BIG_DECIMAL_ZERO } from "../../constants";
import { getSpentFuelRecipient } from "../../entities";
import { getPriceOracle } from "../../entities/priceOracle";

export function handleUpdateFeeCollector(e: UpdateFeeCollector): void {
  let spentFuelRecipient = getSpentFuelRecipient(e.params._new);
  spentFuelRecipient.label = "DAO";
  spentFuelRecipient.percentage = BigDecimal.fromString("100");
  spentFuelRecipient.save();

  let oldSpentFuelRecipient = getSpentFuelRecipient(e.params._new);
  oldSpentFuelRecipient.percentage = BIG_DECIMAL_ZERO;
  oldSpentFuelRecipient.isEnabled = false;
  oldSpentFuelRecipient.save();
}

export function handleUpdateGETUSD(e: UpdateGETUSD): void {
  let priceOracle = getPriceOracle();
  priceOracle.price = e.params._new.divDecimal(BIG_DECIMAL_1E3);
  priceOracle.lastUpdateTimestamp = e.block.timestamp;
  priceOracle.lastUpdateTx = e.transaction.hash;
  priceOracle.save();
}
