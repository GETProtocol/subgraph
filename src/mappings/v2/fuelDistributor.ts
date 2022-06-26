import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  Distribute,
  UpdateDestinationsProtocol,
  UpdateDestinationsRemainder,
} from "../../../generated/FuelDistributorV2/FuelDistributorV2";
import { BIG_DECIMAL_1E18, BIG_DECIMAL_ZERO } from "../../constants";
import { getSpentFuelRecipient } from "../../entities";
import { createSpentFuelCollectedEvent } from "../../entities/spentFuelCollectedEvent";

export function handleDistribute(e: Distribute): void {
  let spentFuelRecipient = getSpentFuelRecipient(e.params.destination);
  let amount = e.params.amount.divDecimal(BIG_DECIMAL_1E18);
  spentFuelRecipient.collectedSpentFuel = spentFuelRecipient.collectedSpentFuel.plus(amount);
  spentFuelRecipient.save();

  createSpentFuelCollectedEvent(e, spentFuelRecipient, e.params.destination, amount, e.params.total.divDecimal(BIG_DECIMAL_1E18));
}

export function handleUpdateDestinationsProtocol(e: UpdateDestinationsProtocol): void {
  for (let i = 0; i < e.params.old.length; ++i) {
    let old = e.params.old[i];
    let spentFuelRecipient = getSpentFuelRecipient(old.destination);
    spentFuelRecipient.percentage = BIG_DECIMAL_ZERO;
    spentFuelRecipient.isEnabled = false;
    spentFuelRecipient.save();
  }

  for (let i = 0; i < e.params.updated.length; ++i) {
    let updated = e.params.updated[i];
    let spentFuelRecipient = getSpentFuelRecipient(updated.destination);
    spentFuelRecipient.source = "PROTOCOL";
    spentFuelRecipient.label = updated.label;
    spentFuelRecipient.percentage = BigDecimal.fromString(updated.percentage.toString()).div(
      BigDecimal.fromString("10000") // 1e4, 1_000_000 becomes 100%
    );
    spentFuelRecipient.isEnabled = true;
    spentFuelRecipient.save();
  }
}
export function handleUpdateDestinationsRemainder(e: UpdateDestinationsRemainder): void {
  for (let i = 0; i < e.params.old.length; ++i) {
    let old = e.params.old[i];
    let spentFuelRecipient = getSpentFuelRecipient(old.destination);
    spentFuelRecipient.percentage = BIG_DECIMAL_ZERO;
    spentFuelRecipient.isEnabled = false;
    spentFuelRecipient.save();
  }

  for (let i = 0; i < e.params.updated.length; ++i) {
    let updated = e.params.updated[i];
    let spentFuelRecipient = getSpentFuelRecipient(updated.destination);
    spentFuelRecipient.source = "REMAINDER";
    spentFuelRecipient.label = updated.label;
    spentFuelRecipient.percentage = BigDecimal.fromString(updated.percentage.toString()).div(
      BigDecimal.fromString("10000") // 1e4, 1_000_000 becomes 100%
    );
    spentFuelRecipient.isEnabled = true;
    spentFuelRecipient.save();
  }
}
