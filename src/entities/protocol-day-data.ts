import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ProtocolDayData } from '../../generated/schema';
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from '../constants'

export function getProtocolDayData(event: ethereum.Event): ProtocolDayData {
    const day = event.block.timestamp.toI32() / 86400
    const date = day * 86400
    
    const id = date;

    let protocolDayData = ProtocolDayData.load(id.toString())

    if(protocolDayData == null) {
        protocolDayData = new ProtocolDayData(id.toString())
        protocolDayData.timestamp = date;
        protocolDayData.fuel_used = BIG_INT_ZERO;
        protocolDayData.mints = BIG_INT_ZERO;
        protocolDayData.ticket_value = BIG_INT_ZERO;
        protocolDayData.scans = BIG_INT_ZERO;
        protocolDayData.claims = BIG_INT_ZERO;
    }

    return protocolDayData as ProtocolDayData
}