const Order = require('./order')

class OrderBook {
    constructor (bids, asks) {
        this.bids = bids.map(bid => {
            return new Order({price: bid[0], volume: bid[1]})
        })

        this.asks = asks.map(ask => {
            return new Order({price: ask[0], volume: ask[1]})
        })
    }

    getBids() {
        return this.bids
    }

    getAsks() {
        return this.asks
    }
}

module.exports = OrderBook