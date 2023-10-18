import { FuelRouted } from "../../../generated/templates/FuelRouterDT/FuelRouterDT";
import { BIG_DECIMAL_1E18 } from "../../constants";

import * as protocol from "../../entities/protocol";
import * as protocolDay from "../../entities/protocolDay";
import * as integrator from "../../entities/integrator";
import * as integratorDay from "../../entities/integratorDay";
import * as event from "../../entities/event";

export function handleFuelRouted(e: FuelRouted): void {
  if (e.params.toDripCollector) return;

  let spentFuel = e.params.fuelAmount.divDecimal(BIG_DECIMAL_1E18);
  let eventAddress = e.transaction.from;
  let eventInstance = event.getEvent(eventAddress);
  let integratorIndex = eventInstance.integrator;

  protocol.updateProtocolFuelRouted(spentFuel);
  protocolDay.updateProtocolFuelRouted(e, spentFuel);
  integrator.updateProtocolFuelRouted(integratorIndex, spentFuel);
  integratorDay.updateProtocolFuelRouted(integratorIndex, e, spentFuel);
}
