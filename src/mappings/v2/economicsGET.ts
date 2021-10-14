import { DepotSwiped } from "../../../generated/EconomicsGETV2/EconomicsGETV2";
import { FUEL_ACTIVATED_BLOCK } from "../../constants";
import { getProtocol, getProtocolDay } from "../../entities";

export function handleDepotSwiped(e: DepotSwiped): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDay(e);

  if (e.block.number.ge(FUEL_ACTIVATED_BLOCK)) {
    protocol.getMovedToFeeCollector = protocol.getMovedToFeeCollector.plus(e.params.balance);
    protocolDay.getMovedToFeeCollector = protocolDay.getMovedToFeeCollector.plus(e.params.balance);
    protocol.save();
    protocolDay.save();
  }
}
