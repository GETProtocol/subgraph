import { RegisterEventCall } from "../../generated/EventMetaData/EventMetaData";
import { getEvent } from "../entities";

/**
 * NOTE we need access to the integratorAddress, which is not emitted in the event
 * So, we need to use a callHandler to get access to the integratorAddress
 */
export function onRegisterEvent(call: RegisterEventCall): void {
  const id = call.inputs.eventAddress.toHex();

  const event = getEvent(id);
  event.integrator_address = call.inputs.integratorAccountPublicKeyHash.toHex();

  event.save();
}
