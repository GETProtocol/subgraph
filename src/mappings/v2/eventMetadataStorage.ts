import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  EventMetadataStorageV2 as EventMetadataStorageContract,
  NewEventRegistered,
} from "../../../generated/EventMetadataStorageV2/EventMetadataStorageV2";
import { BIG_INT_ZERO, EVENT_METADATA_STORAGE_ADDRESS_V2 } from "../../constants";
import { getEvent, createUsageEvent } from "../../entities";

export function handleNewEventRegistered(e: NewEventRegistered): void {
  let address = e.params.eventAddress;
  let eventMetadataStorageContract = EventMetadataStorageContract.bind(EVENT_METADATA_STORAGE_ADDRESS_V2);
  let eventData = eventMetadataStorageContract.getEventData(address);

  let latitude = BigDecimal.fromString(eventData.value5[0].toString());
  let longitude = BigDecimal.fromString(eventData.value5[1].toString());
  let currency = eventData.value5[2].toString();
  let ticketeerName = eventData.value5[3].toString();
  let startTime = eventData.value6[0];
  let endTime = eventData.value6[1];

  let event = getEvent(address.toHexString());
  event.relayer = eventData.value0.toHexString();
  event.eventName = eventData.value2;
  event.shopUrl = eventData.value3;
  event.imageUrl = eventData.value4;
  event.orderTime = e.params.orderTime;
  event.latitude = latitude;
  event.longitude = longitude;
  event.currency = currency;
  event.ticketeerName = ticketeerName;
  event.startTime = startTime;
  event.endTime = endTime;

  event.save();

  createUsageEvent(e, event, BIG_INT_ZERO, "NEW_EVENT", e.params.orderTime, e.params.getUsed);
}
