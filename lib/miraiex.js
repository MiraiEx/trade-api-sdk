const axios = require('axios'),
crypto = require('crypto'),
OrderBook = require('../models/orderBook'),
TradeHistory = require('../models/tradeHistory')

class MiraiEx {
    constructor (options) {
        if (!options) {
            console.log("[NOTICE] Only a subset of features are available without apikey!")
        }

        if (options.baseUrl) {
            this.baseUrl = options.baseUrl
        }
        else {
            this.baseUrl = 'https://api.miraiex.com/'
        }

        if (options.version) {
            this.baseUrl += options.version
        }
        else {
            this.baseUrl += 'v1'
        }

        if (options.hardenedSecurity) {
            if (!options.secretKey) {
                throw new Error("SecretKey is missing!")
            }

            if (!options.clientId) {
                throw new Error("ClientId is missing!")
            }
            this.hardenedSecurity = options.hardenedSecurity
        }

        if (!options.apiKey) {
            throw new Error("API Key is missing!")
        }

        if (options.apiKey) {
            this.apiKey = options.apiKey
        }

        if (options.secretKey) {
            this.secretKey = options.secretKey
        }

        if (options.clientId) {
            this.clientId = options.clientId
        }

        this.nonce = options.nonce || 0
        this.outputType = options.outputType || 'console'
        this.markets = new Set(['BTCNOK', 'LTCNOK'])
        this._internalUpdateMarkets()
    }

    generateSignature() {
        return crypto.createHmac('sha256', this.secretKey).update(`${this.nonce++}${this.apiKey}`).digest('hex')
    }

    getNonce() {
        return this.nonce
    }

    _internalUpdateMarkets() {
        axios.get(`${this.baseUrl}/markets`).then(result => {
            const marketList = new Set()
            result.data.map(market => {
                marketList.add(market.id)
            })

            this.markets = marketList
        })
        .catch(error => {
            return reject({ "message": error.response.data.message })
        })
    }

    getBalance() {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                if (this.outputType === 'console') {
                    console.log("[ERROR] getBalance(): API Key needed for this feature!")
                }
                return reject({ "message": "API Key needed for this feature!" })
            }

            const headers = {}

            console.log(this.hardenedSecurity)
            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.get(`${this.baseUrl}/balances`, { headers: headers }).then(result => {
                if (this.outputType === 'console') {
                    console.table(result.data, ["currency", "balance", "hold", "available"])
                }
                return resolve(result.data)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    getOrderBook(market) {
        return new Promise((resolve, reject) => {
            if (!this.markets.has(market)) {
                return reject({ "message": `Market '${market}' is not supported.` })
            }

            const headers = {}

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.get(`${this.baseUrl}/markets/${market}/depth`, { headers: headers }).then(result => {
                const book = new OrderBook(result.data.bids, result.data.asks)

                if (this.outputType === 'console') {
                    console.log(`${market}' bids`)
                    console.table(book.getBids(), ["price", "volume"])
                    console.log(`\n${market}' asks`)
                    console.table(book.getAsks(), ["price", "volume"])
                }

                return resolve(result.data)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    getLatestMarketTrades(market) {
        return new Promise((resolve, reject) => {
            if (!this.markets.has(market)) {
                return reject({ "message": `Market '${market}' is not supported.` })
            }

            const headers = { "Content-Type": "application/json" }

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.get(`${this.baseUrl}/markets/${market}/history`, { headers: headers }).then(result => {
                const tradeHistory = result.data.map(trade => {
                    return new TradeHistory(trade)
                })
                
                if (this.outputType === 'console') {
                    console.table(tradeHistory, ["type", "amount", "price", "finished_at"])
                }

                return resolve(tradeHistory)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    createOrder(market, type, price, amount) {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                if (this.outputType === 'console') {
                    console.log("[ERROR] getBalance(): API Key needed for this feature!")
                }
                return reject({ "message": "API Key needed for this feature!" })
            }

            if (!this.markets.has(market)) {
                return reject({ "message": `Market '${market}' is not supported.` })
            }

            if (type.toLowerCase() !== 'bid' && type.toLowerCase() !== 'ask') {
                return reject({ "message": `Expected 'bid' or 'ask' as type, not '${type}'` })
            }

            if (amount < 0) {
                return reject({ "message": "Amount has to be larger than 0." })
            }

            if (price < 0) {
                return reject({ "message": "Price has to be larger than 0." })
            }

            const headers = { "Content-Type": "application/json" }

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.post(`${this.baseUrl}/orders`, {
                "price": price.toString(),
                "amount": amount.toString(),
                "market": market,
                "type": type.toLowerCase()
            },
            {
                headers: headers
            }).then(result => {
                if (this.outputType === 'console') {
                    console.log(`Order #${result.data.id} has been sucessfully created.`)
                }

                return resolve(result.data.id)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    getOrders() {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                if (this.outputType === 'console') {
                    console.log("[ERROR] getOrders(): API Key needed for this feature!")
                }
                return reject({ "message": "API Key needed for this feature!" })
            }

            const headers = { "Content-Type": "application/json" }

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.get(`${this.baseUrl}/orders`, { headers: headers }).then(result => {
                if (this.outputType === 'console') {
                    if (json.length === 0) {
                        console.log("No active orders found!")
                    }
                    else {
                        console.table(json, ["market", "type", "price", "amount", "remaining", "matched", "created_at"])
                    }
                }

                return resolve(result.data)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    cancelOrder(orderId) {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                if (this.outputType === 'console') {
                    console.log("[ERROR] cancelOrder(): API Key needed for this feature!")
                }
                return reject({ "message": "API Key needed for this feature!" })
            }

            const headers = { "Content-Type": "application/json" }

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.delete(`${this.baseUrl}/orders/${orderId}`, { headers: headers }).then(() => {
                if (this.outputType === 'console') {
                    console.log(`Order #${orderId} has successfully been cancelled.`)
                }

                return resolve()
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    cancelAllOrders() {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                if (this.outputType === 'console') {
                    console.log("[ERROR] cancelAllOrders(): API Key needed for this feature!")
                }
                return reject({ "message": "API Key needed for this feature!" })
            }

            const headers = { "Content-Type": "application/json" }

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.delete(`${this.baseUrl}/orders`, { headers: headers }).then(result => {
                if (this.outputType === 'console') {
                    console.log(`All orders has been cancelled.`)
                }

                return resolve(result.data)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }

    cancelAllOrdersInMarket(market) {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                if (this.outputType === 'console') {
                    console.log("[ERROR] cancelAllOrdersInMarket(): API Key needed for this feature!")
                }
                return reject({ "message": "API Key needed for this feature!" })
            }

            if (!this.markets.has(market)) {
                return reject({ "message": `Market '${market}' is not supported.` })
            }

            const headers = { "Content-Type": "application/json" }

            if (this.hardenedSecurity) {
                Object.assign(headers, { "miraiex-user-clientid": this.clientId, "miraiex-user-access-key": this.generateSignature() })
            }
            else {
                Object.assign(headers, { "miraiex-access-key": this.apiKey })
            }

            axios.delete(`${this.baseUrl}/orders/${market}`, { headers: headers }).then(result => {
                if (this.outputType === 'console') {
                    console.log(`All orders in ${market} has been cancelled.`)
                }

                return resolve(result.data)
            })
            .catch(error => {
                return reject({ "message": error.response.data.message })
            })
        })
    }
}

module.exports = MiraiEx