import { Address } from "@graphprotocol/graph-ts";
import { SpentFuelRecipient } from "../../generated/schema";
import { BIG_DECIMAL_ZERO } from "../constants";

export function getSpentFuelRecipient(address: Address): SpentFuelRecipient {
  let spentFuelRecipient = SpentFuelRecipient.load(address.toHexString());

  if (spentFuelRecipient == null) {
    spentFuelRecipient = new SpentFuelRecipient(address.toHexString());
    spentFuelRecipient.label = "";
    spentFuelRecipient.percentage = BIG_DECIMAL_ZERO;
    spentFuelRecipient.collectedSpentFuel = BIG_DECIMAL_ZERO;
    spentFuelRecipient.isEnabled = true;
  }

  return spentFuelRecipient as SpentFuelRecipient;
}
