import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  EventMetadataStorageV1 as EventMetadataStorageContract,
  newEventRegistered,
} from "../../../generated/EventMetadataStorageV1/EventMetadataStorageV1";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, EVENT_METADATA_STORAGE_ADDRESS_V1 } from "../../constants";
import { getEvent, createUsageEvent, getIntegratorByTicketeerName } from "../../entities";

export function handleNewEventRegistered(e: newEventRegistered): void {
  let address = e.params.eventAddress;
  let eventMetadataStorageContract = EventMetadataStorageContract.bind(EVENT_METADATA_STORAGE_ADDRESS_V1);
  let eventData = eventMetadataStorageContract.getEventData(address);

  let latitude = BigDecimal.fromString(eventData.value5[0].toString());
  let longitude = BigDecimal.fromString(eventData.value5[1].toString());
  let currency = eventData.value5[2].toString();
  let ticketeerName = eventData.value5[3].toString();
  let startTime = eventData.value6[0];
  let endTime = eventData.value6[1];

  let integrator = getIntegratorByTicketeerName(ticketeerName);
  let event = getEvent(address);

  event.createTx = e.transaction.hash;
  event.integrator = integrator.id;
  event.relayer = e.transaction.from.toHexString();
  event.name = eventData.value2;
  event.shopUrl = eventData.value3;
  event.imageUrl = eventData.value4;
  event.latitude = latitude;
  event.longitude = longitude;
  event.currency = currency;
  event.startTime = startTime;
  event.endTime = endTime;

  event.save();

  createUsageEvent(e, event, BIG_INT_ZERO, "NEW_EVENT", e.params.orderTime, BIG_DECIMAL_ZERO);
}
