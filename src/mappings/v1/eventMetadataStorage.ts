import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  EventMetadataStorageV1 as EventMetadataStorageContract,
  newEventRegistered,
} from "../../../generated/EventMetadataStorageV1/EventMetadataStorageV1";
import { BIG_INT_ZERO, EVENT_METADATA_STORAGE_ADDRESS_V1, V1_END_BLOCK } from "../../constants";
import { getEvent, createUsageEvent } from "../../entities";

export function handleNewEventRegistered(e: newEventRegistered): void {
  if (e.block.number.gt(V1_END_BLOCK)) return;
  let address = e.params.eventAddress;
  let eventMetadataStorageContract = EventMetadataStorageContract.bind(EVENT_METADATA_STORAGE_ADDRESS_V1);
  let eventData = eventMetadataStorageContract.getEventData(address);

  let latitude = BigDecimal.fromString(eventData.value5[0].toString());
  let longitude = BigDecimal.fromString(eventData.value5[1].toString());

  let event = getEvent(address.toHexString());
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
