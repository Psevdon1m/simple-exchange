# Exchange Smart Contract

This smart contract represents an exchange where users can trade tokens. It allows users to deposit and withdraw both Ether and ERC20 tokens, create and fill orders, and includes a fee mechanism.

## Features

- Deposit and withdraw Ether and ERC20 tokens.
- Create and fill trading orders.
- Fee mechanism for each trade.

## Seeding Scripts

This repository includes seeding scripts that can be used to initialize the exchange with predefined data for testing or demonstration purposes.

## Unit Tests

Unit tests are included in this repository to ensure the correctness and proper functionality of the exchange smart contract.

## Contract Details

- Solidity Version: ^0.8.0 <0.9.0
- Token Contract: Token.sol (imported)

## Functionality

- Deposit and Withdrawal:

  - `depositEther`: Allows users to deposit Ether into the exchange.
  - `depositToken`: Allows users to deposit ERC20 tokens into the exchange.
  - `withdrawEther`: Allows users to withdraw deposited Ether from the exchange.
  - `withdrawTokens`: Allows users to withdraw deposited ERC20 tokens from the exchange.

- Order Creation and Management:

  - `makeOrder`: Allows users to create a trading order.
  - `cancelOrder`: Allows users to cancel a previously created order.

- Order Filling and Trading:

  - `fillOrder`: Allows users to fill a trading order.

- Balance and Status:
  - `balanceOf`: Returns the balance of a specific token for a given user.
  - `changeStatus`: Changes the order status of the exchange.

## Events

- `Deposit`: Fired when a deposit is made by a user.
- `Withdraw`: Fired when a withdrawal is made by a user.
- `OrderMade`: Fired when a new order is created.
- `CancelOrder`: Fired when an order is canceled.
- `Trade`: Fired when a trade is executed.

## License

This smart contract is released under the UNLICENSED SPDX-License-Identifier.
