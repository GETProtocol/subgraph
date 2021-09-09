import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { RelayerDay } from '../../generated/schema';
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from '../constants'

export function getRelayerDay(event: ethereum.Event): RelayerDay {
    const relayerAddress = event.transaction.from.toHex()
    
    const day = event.block.timestamp.toI32() / 86400
    const date = day * 86400
    
    const id = relayerAddress.concat('-').concat(date.toString())

    let relayerDay = RelayerDay.load(id)

    if(relayerDay == null) {
        relayerDay = new RelayerDay(id)
        relayerDay.relayer_address = relayerAddress;
        relayerDay.timestamp = date;
        relayerDay.fuel_used = BIG_INT_ZERO;
        relayerDay.mints = BIG_INT_ZERO;
        relayerDay.ticket_value = BIG_INT_ZERO;
        relayerDay.scans = BIG_INT_ZERO;
        relayerDay.claims = BIG_INT_ZERO;
    }

    return relayerDay as RelayerDay
}