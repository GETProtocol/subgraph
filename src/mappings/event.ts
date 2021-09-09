import { BigInt, ByteArray } from "@graphprotocol/graph-ts"
import { BIG_INT_ONE } from '../constants/index';
import { newEventRegistered, RegisterEventCall } from '../../generated/EventMetaData/EventMetaData';
import { getEvent } from '../entities';

/**
 * NOTE we need access to the integratorAddress, which is not emitted in the event
 * So, we need to use a callHandler to get access to the integratorAddress
 */
export function onRegisterEvent(call: RegisterEventCall): void {
    let id = call.inputs.eventAddress.toHex()

    let event = getEvent(id)
    event.integrator_address = call.inputs.integratorAccountPublicKeyHash.toHex();

    event.save()
}