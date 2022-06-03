import { EventCreated } from "../../../generated/EventFactoryV2/EventFactoryV2";
import { EventImplementation } from "../../../generated/templates";
import { BIG_DECIMAL_ZERO, BIG_INT_ONE, BIG_INT_ZERO } from "../../constants";
import {
  createUsageEvent,
  getEvent,
  getIntegratorByRelayerAddress,
  getIntegratorDayByIndexAndEvent,
  getProtocol,
  getProtocolDay,
} from "../../entities";

export function handleEventCreated(e: EventCreated): void {
  EventImplementation.create(e.params.eventImplementationProxy);
  let event = getEvent(e.params.eventImplementationProxy);
  event.createTx = e.transaction.hash;
  event.blockNumber = e.block.number;
  event.blockTimestamp = e.block.timestamp;
  event.save();

  let integrator = getIntegratorByRelayerAddress(e.transaction.from);
  integrator.eventCount = integrator.eventCount.plus(BIG_INT_ONE);
  integrator.save();

  let integratorDay = getIntegratorDayByIndexAndEvent(integrator.id, e);
  integratorDay.eventCount = integratorDay.eventCount.plus(BIG_INT_ONE);
  integratorDay.save();

  let protocol = getProtocol();
  protocol.eventCount = protocol.eventCount.plus(BIG_INT_ONE);
  protocol.save();

  let protocolDay = getProtocolDay(e);
  protocolDay.eventCount = protocolDay.eventCount.plus(BIG_INT_ONE);
  protocolDay.save();

  createUsageEvent(e, event, BIG_INT_ZERO, "EVENT_CREATED", e.block.timestamp, BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO);
}
