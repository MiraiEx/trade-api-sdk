class TradeHistory {
    constructor(options) {
        this.type = options.type
        this.amount = options.amount
        this.price = options.price
        this.finished_at = options.created_at
    }
}

module.exports = TradeHistory