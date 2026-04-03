Live now at: https://kyleleesang.github.io/bitcoin-psbt/


  PSBT Workbench

  An institutional Bitcoin transaction coordinator that implements the full BIP-174 PSBT lifecycle in the browser. Built for operations teams debugging signing flows and verifying transaction construction
   before touching production infrastructure.

  What is a PSBT?

  Partially Signed Bitcoin Transactions (BIP-174, extended by BIP-370) are the standard format for any Bitcoin workflow where construction and signing are separated — multisig wallets, hardware wallet
  coordination, collaborative custody, CoinJoin. A PSBT is a structured container passed between participants, each adding their piece, without anyone ever needing to share a private key.

  Features

  - Full BIP-174 lifecycle — Creator → Updater → Signer → Combiner → Finalizer → Extractor
  - Multi-party signing — 2-of-3, 3-of-5, and 1-of-1 scenarios with named signers
  - Live PSBT Inspector — see inputs, outputs, partial signatures, witness scripts, and BIP-32 paths at every stage
  - Import / Export — paste any PSBT in base64 or hex to resume a workflow mid-stream; export at any stage
  - P2WSH multisig — native SegWit multisig with sorted pubkeys and witness script enrichment
  - Runs entirely in the browser — no server, no key material ever leaves the page

  Stack

  - Next.js 16 (static export, App Router)
  - bitcoinjs-lib 7
  - ecpair 3
  - bip32 5
  - @bitcoin-js/tiny-secp256k1-asmjs

  Getting Started

  npm install
  npm run dev -- --webpack

  Open http://localhost:3000.

  The PSBT Lifecycle

  1. Creator

  Constructs a new unsigned PSBT from UTXOs and outputs. Selects inputs (txid, vout, amount) and defines destination addresses and amounts.

  2. Updater

  Enriches the PSBT with the data signers need: witness UTXO (the output being spent), the redeem/witness script, and BIP-32 derivation paths for each key holder. Without this step, hardware wallets and
  air-gapped signers cannot safely verify what they are signing.

  3. Signer

  Each key holder independently loads the PSBT, verifies the contents, and applies their signature. No signer needs to trust the others or be online at the same time.

  4. Combiner

  Merges the partially-signed PSBTs from each signer into a single PSBT containing all collected signatures. No new signing happens here.

  5. Finalizer

  Once the signature threshold is met, assembles the final scriptWitness from the collected signatures. After finalization no more signatures can be added.

  6. Extractor

  Pulls the complete, fully-signed raw transaction out of the PSBT container. The result is broadcast-ready hex — submit it to any Bitcoin node or block explorer.

  Pre-built Scenarios

  ┌────────────────────────────┬───────────────────────────┬───────────────────────────┐
  │          Scenario          │           Setup           │         Use case          │
  ├────────────────────────────┼───────────────────────────┼───────────────────────────┤
  │ 2-of-3 Multisig Vault      │ 2 required, 3 key holders │ Institutional custody     │
  ├────────────────────────────┼───────────────────────────┼───────────────────────────┤
  │ 3-of-5 Corporate Treasury  │ 3 required, 5 key holders │ Board-level authorization │
  ├────────────────────────────┼───────────────────────────┼───────────────────────────┤
  │ Single-sig Hardware Wallet │ 1-of-1 P2WPKH             │ Personal hardware wallet  │
  └────────────────────────────┴───────────────────────────┴───────────────────────────┘

  Import / Export

  Any PSBT can be exported at any stage in both base64 and hex format using the Export card in the sidebar. To resume an in-progress PSBT, paste it into the Import card — the app auto-detects the format
  and jumps to the appropriate step.

  Architecture

  app/
    page.js          — Full UI: reducer, step panels, sidebar
    layout.js        — Root layout and metadata
  components/
    ui.js            — Design system: Badge, Dot, Card, Field, Inp, TArea, Btn
  lib/
    bitcoin.js       — Pure Bitcoin logic: key generation, multisig, PSBT lifecycle
  next.config.js     — Webpack polyfills for Buffer, stream, crypto (browser compat)

  The Bitcoin logic in lib/bitcoin.js is fully decoupled from the UI and can be imported into any JavaScript environment that supports ES modules.

  ---
  Would you like me to write this directly to README.md?



























This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
