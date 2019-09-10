MiraiEx API SDK
=====

A lightweight-NodeJS module for accessing MiraiEx trading API.

(We are looking for (PR) code improvements and (issue) feature requests!)

## Notice

- API abstractions can contain malicious code, ALWAYS check over the source before using it. *Don't trust. Verify.*

## Features

- Interact with MiraiEx trading API via REST.
- Visual feedback of response data (optional).

## Documentation

Full API-documentation can be found on [gitbook](https://doc.api.miraiex.com)

## Installation

```
npm install @miraiex/trade-sdk
```

## Quickstart

```
const miraiexSDK = require('@miraiex/trade-sdk')

const MiraiEx = new miraiexSDK({
    "version": "v1",
    "hardenedSecurity": true|false,
    "nonce": 0, // Required if `hardenedSecurity` is activated
    "outputType": "console", // Optional, leave empty if no output to console wanted
    "secretKey": "", // Required if `hardenedSecurity` is activated
    "clientId": "", // Required if `hardenedSecurity` is activated
    "apiKey": ""
})
```

## Known issues

- Nonce has to be handled manually by the client. If you've lost count of your (integer) nonce, contact support@miraiex.com

## Questions?

If you want your library listed with official support, leave an issue with link to your public repository.