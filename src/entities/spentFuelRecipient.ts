import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { SpentFuelRecipient } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_DECIMAL_1E2 } from "../constants";

export function getSpentFuelRecipient(address: Address): SpentFuelRecipient {
  let spentFuelRecipient = SpentFuelRecipient.load(address.toHexString());

  if (spentFuelRecipient == null) {
    spentFuelRecipient = new SpentFuelRecipient(address.toHexString());
    spentFuelRecipient.source = "";
    spentFuelRecipient.label = "";
    spentFuelRecipient.percentage = BIG_DECIMAL_ZERO;
    spentFuelRecipient.collectedSpentFuel = BIG_DECIMAL_ZERO;
    spentFuelRecipient.isEnabled = true;
  }

  return spentFuelRecipient as SpentFuelRecipient;
}

export function getSpentFuelRecipientPercentage(address: Address): BigDecimal {
  let spentFuelRecipient = SpentFuelRecipient.load(address.toHexString());

  if (spentFuelRecipient == null || !spentFuelRecipient.isEnabled) {
    return BIG_DECIMAL_ZERO;
  }

  return spentFuelRecipient.percentage.div(BIG_DECIMAL_1E2);
}
