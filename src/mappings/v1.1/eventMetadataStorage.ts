import { BigDecimal } from "@graphprotocol/graph-ts";
import {
  EventMetadataStorageV1_1 as EventMetadataStorageContract,
  NewEventRegistered,
} from "../../../generated/EventMetadataStorageV1_1/EventMetadataStorageV1_1";
import { Event } from "../../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ONE, BIG_INT_ZERO, EVENT_METADATA_STORAGE_ADDRESS_V1_1 } from "../../constants";
import {
  getEvent,
  createUsageEvent,
  getIntegratorByTicketeerName,
  getIntegratorDayByIndexAndEvent,
  getProtocol,
  getProtocolDay,
} from "../../entities";

export function handleNewEventRegistered(e: NewEventRegistered): void {
  let address = e.params.eventAddress;
  let eventMetadataStorageContract = EventMetadataStorageContract.bind(EVENT_METADATA_STORAGE_ADDRESS_V1_1);
  let eventData = eventMetadataStorageContract.getEventData(address);

  let latitude = BigDecimal.fromString(eventData.value5[0].toString());
  let longitude = BigDecimal.fromString(eventData.value5[1].toString());
  let currency = eventData.value5[2].toString();
  let ticketeerName = eventData.value5[3].toString();
  let startTime = eventData.value6[0];
  let endTime = eventData.value6[1];

  // newEventRegistered is called even during event updates. Although not elegant we opt to check that the event exists
  // by attempting to load it from the store. If this returns null then the event isn't found, so increment the counts
  // and then continue to instantiate a new event as normal.
  let existingEvent = Event.load(address.toHexString());
  let event = getEvent(address);
  if (existingEvent == null) {
    // Only set the integrator and relayer on first creation, do not allow switching of ticketeer.
    let protocol = getProtocol();
    let protocolDay = getProtocolDay(e);
    let integrator = getIntegratorByTicketeerName(ticketeerName);
    let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);
    event.integrator = integrator.id;
    event.relayer = e.transaction.from.toHexString();

    protocol.eventCount = protocol.eventCount.plus(BIG_INT_ONE);
    protocolDay.eventCount = protocolDay.eventCount.plus(BIG_INT_ONE);
    integrator.eventCount = integrator.eventCount.plus(BIG_INT_ONE);
    integratorDay.eventCount = integratorDay.eventCount.plus(BIG_INT_ONE);
    protocol.save();
    protocolDay.save();
    integrator.save();
    integratorDay.save();
  }

  event.createTx = e.transaction.hash;
  event.blockNumber = e.block.number;
  event.blockTimestamp = e.block.timestamp;
  event.name = eventData.value2;
  event.shopUrl = eventData.value3;
  event.imageUrl = eventData.value4;
  event.latitude = latitude;
  event.longitude = longitude;
  event.currency = currency;
  event.startTime = startTime;
  event.endTime = endTime;
  event.save();

  createUsageEvent(e, event, BIG_INT_ZERO, "EVENT_CREATED", e.params.orderTime, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
}
