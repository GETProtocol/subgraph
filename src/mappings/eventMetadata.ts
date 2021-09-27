import { log } from "@graphprotocol/graph-ts";
import {
  EventMetadata as EventMetadataContract,
  newEventRegistered,
} from "../../generated/EventMetadata/EventMetadata";
import { EVENT_METADATA_ADDRESS } from "../constants/addresses";
import { getEvent } from "../entities";

export function handleNewEventRegistered(e: newEventRegistered): void {
  let address = e.params.eventAddress;
  let eventMetadataContract = EventMetadataContract.bind(EVENT_METADATA_ADDRESS);
  let eventData = eventMetadataContract.getEventData(address);
  // let usageEvent = getUsageEvent(e, e.transaction.hash.toI32())

  log.info("NEW EVENT REGISTERED", [eventData.value2.toString()]);

  let event = getEvent(address.toHex());
  event.getUsed = e.params.getUsed;
  event.relayer = eventData.value0.toHex();
  event.eventName = eventData.value2;
  event.shopUrl = eventData.value3;
  event.imageUrl = eventData.value4;
  event.timestamp = e.params.orderTime;

  // usageEvent.getUsed = usageEvent.getUsed.plus(e.params.getUsed);
  // usageEvent.interaction = "NEW_EVENT"

  event.save();
  // usageEvent.save()
}
