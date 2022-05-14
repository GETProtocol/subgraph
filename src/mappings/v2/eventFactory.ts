import { EventCreated } from "../../../generated/EventFactoryV2/EventFactoryV2";
import { EventImplementation } from "../../../generated/templates";
import { getEvent } from "../../entities";

export function handleEventCreated(e: EventCreated): void {
  EventImplementation.create(e.params.eventImplementationProxy);
  let event = getEvent(e.params.eventImplementationProxy);
  event.createTx = e.transaction.hash;
  event.save();
}
