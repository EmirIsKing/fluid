# Fluid

**Cross-chain payments. No swaps. No bridges.**

Fluid lets you pay anyone on any chain using whatever asset you already hold — one balance, one signature, no swap or bridge UI in sight.

🔗 [Live demo](https://fluid-smoky-three.vercel.app/)

## Overview

Send ETH to a friend on Ethereum while your wallet only holds stablecoins. Pay someone on Base with USDC pulled from your Arbitrum balance. Fluid routes the payment cross-chain behind the scenes, so you never have to open a DEX, use a bridge, or switch networks manually.

Under the hood, Fluid is powered by **Particle Network's Universal Accounts**, which upgrade a standard EOA wallet into a cross-chain account with a single unified balance.

## Features

- **Pay with any asset** — Spend ETH, USDC, USDT, or anything in your unified balance without converting first.
- **Deliver on any chain** — Choose the recipient's network: Base, Ethereum, Arbitrum One, BNB Chain, or X Layer.
- **No swaps, no bridges** — Fluid handles cross-chain routing invisibly in a single signature.
- **Gasless execution** — One tap to send. No gas tokens to hold, no network switching, no extra approvals.

## How it works

1. **Connect your wallet** — Link your existing EOA. Fluid upgrades it to a Universal Account (same address, cross-chain capabilities).
2. **Pick recipient & chain** — Enter an address or `@username` and choose which network they should receive funds on.
3. **Send what you have** — Pay from your balance as-is. Fluid settles cross-chain behind the scenes.

## Supported networks

- Base
- Ethereum
- Arbitrum One
- BNB Chain
- X Layer

## Tech

Built on **Particle Network's Universal Accounts**, which abstract away chain selection, gas, and bridging so a single signature can settle a payment across networks (typical settlement time in the demo: ~4s).

## Getting started

1. Visit the [app](https://fluid-smoky-three.vercel.app/) and click **Connect Wallet**.
2. Go to **[Send](https://fluid-smoky-three.vercel.app/send)**, enter a recipient and destination chain, and choose the asset to pay with.
3. Confirm with a single signature — no gas token top-ups, no bridging, no swaps.

## License

Add your license here.
