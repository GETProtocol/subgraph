import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { RelayerDayData } from '../../../generated/schema';
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from '../../constants'

export function getRelayerDayData(event: ethereum.Event): RelayerDayData {
    const relayerAddress = event.transaction.from.toHex()
    
    const day = event.block.timestamp.toI32() / 86400
    const date = day * 86400
    
    const id = relayerAddress.concat('-').concat(date.toString())

    let relayerDayData = RelayerDayData.load(id)

    if(relayerDayData == null) {
        relayerDayData = new RelayerDayData(id)
        relayerDayData.relayer_address = relayerAddress;
        relayerDayData.timestamp = date;
        relayerDayData.fuel_used = BIG_INT_ZERO;
        relayerDayData.mints = BIG_INT_ZERO;
        relayerDayData.ticket_value = BIG_INT_ZERO;
        relayerDayData.scans = BIG_INT_ZERO;
        relayerDayData.claims = BIG_INT_ZERO;
    }

    return relayerDayData as RelayerDayData
}





