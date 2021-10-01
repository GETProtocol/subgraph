import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  EventMetadataV1 as EventMetadataContract,
  newEventRegistered,
} from "../../../generated/EventMetadataV1/EventMetadataV1";
import { BIG_INT_ZERO, EVENT_METADATA_ADDRESS } from "../../constants";
import { getEvent, createUsageEvent } from "../../entities";

export function handleNewEventRegistered(e: newEventRegistered): void {
  let address = e.params.eventAddress;
  let eventMetadataContract = EventMetadataContract.bind(EVENT_METADATA_ADDRESS);
  let eventData = eventMetadataContract.getEventData(address);

  let latitude = BigDecimal.fromString(eventData.value5[0].toString());
  let longitude = BigDecimal.fromString(eventData.value5[1].toString());

  let event = getEvent(address.toHexString());
  event.getUsed = event.getUsed.plus(e.params.getUsed);
  event.relayer = eventData.value0.toHexString();
  event.eventName = eventData.value2;
  event.shopUrl = eventData.value3;
  event.imageUrl = eventData.value4;
  event.orderTime = e.params.orderTime;
  event.latitude = latitude;
  event.longitude = longitude;

  event.save();

  createUsageEvent(e, event, BIG_INT_ZERO, "NEW_EVENT", e.params.orderTime, e.params.getUsed);
}
