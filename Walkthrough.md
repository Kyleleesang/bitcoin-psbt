# PSBT Workbench — Demo Walkthrough

A step-by-step guide to testing every feature of the app with exact dummy data and expected results.

---

## Quick-start

```
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Signer Key Reference

Paste these WIF keys into the corresponding signer slots before clicking "Create PSBT". Using fixed keys means the same public keys are used every run, making results reproducible.

| Slot | Name  | Role             | WIF (testnet)                                        | Public Key (hex)                                                   |
|------|-------|------------------|------------------------------------------------------|--------------------------------------------------------------------|
| 0    | Alice | Treasury Officer | `cW1A6frDQfrwayYo8AGukKx7zynJ6d5xfiBzzCFrKfmdCbFf75Nt` | `027b0a959afd8282b87607a10e7de3841e8be1a456cf9ea50423629bedbba7f30d` |
| 1    | Bob   | Risk Manager     | `cUFf5hUEwJ8JNFzcrtWgGYFrYoZqnH3qTb9kXfbwqHir5erY5Q78` | `03d67109be9b6b5bf81601e310f71e52d2dccc279bc05bf74144a99d74bcf238bd` |
| 2    | Carol | Compliance Lead  | `cQUASk2BM9EDQqMoLEUXvVjS4ShUa82UnpCbbDa1gSAWeWi6nazU` | `025c9d6dd6ef2ae2e0a8b609a2c8f14e6a6bf0375167189fbf98add28c3b5ae70d` |
| 3    | Dave  | CEO              | `cThEsgDX4mqj219RyMahoKZAAvrosdz6gXk1hvszb5vv95tLTJuK` | `02e0f00435bbe24739a4c6cd2cf8914a289ba47d3b1819faeeac839169bb0e1d04` |
| 4    | Eve   | Board Chair      | `cQanVUGYTsLXTLpFdFJYhZQhpGry31TdopVHXievLvePQfrv9Enr` | `0257ee8d0458a61b995b3268058f1e0aa3ef90c77a8832bd122cff56b1c86e4a6d` |

---

## Scenario 1 — 2-of-3 Multisig Vault (minimum quorum — Alice + Bob)

The simplest multisig case: 3 signers, only 2 needed to spend. Alice and Bob sign; Carol is skipped.

**Steps:**
1. Click the **"2-of-3 Multisig Vault"** scenario button.
2. Paste the WIF keys for **Alice** (slot 0), **Bob** (slot 1), and **Carol** (slot 2):
   ```
   Slot 0 — Alice: cW1A6frDQfrwayYo8AGukKx7zynJ6d5xfiBzzCFrKfmdCbFf75Nt
   Slot 1 — Bob:   cUFf5hUEwJ8JNFzcrtWgGYFrYoZqnH3qTb9kXfbwqHir5erY5Q78
   Slot 2 — Carol: cQUASk2BM9EDQqMoLEUXvVjS4ShUa82UnpCbbDa1gSAWeWi6nazU
   ```
3. Click **"Create PSBT"**.
4. Advance to **Updater** — review the panel.
5. Advance to **Signer** — click **Sign** for **Alice** (slot 0), then **Sign** for **Bob** (slot 1). Do not sign for Carol.
6. Advance to **Combiner** — click **"Combine PSBTs"**.
7. Advance to **Finalizer** — click **"Finalize PSBT"**.
8. Advance to **Extractor** — click **"Extract Transaction"**.

**Input auto-filled by the scenario:**
```
TXID:   7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c
vout:   0
Amount: 100,000,000 sats  (1.0 BTC)
```

**Outputs auto-filled by the scenario:**
```
Output 0 — Client withdrawal:  49,950,000 sats
Output 1 — Change to vault:    49,950,000 sats
Fee (implicit):                   100,000 sats
```

**What to verify:**
- Creator: Activity Log shows `3 user key(s), 0 generated` and `PSBT created: 1 input(s), 2 output(s)`.
- Updater: Witness UTXO (`100,000,000` sats), witness script (2-of-3 P2WSH), and 3 BIP-32 derivation paths (`m/48'/0'/0'/2'/0`, `/1`, `/2`) are all displayed.
- Signer: Alice and Bob show a **SIGNED** badge. Carol shows **AWAITING**.
- Combiner: Activity Log shows `Combined 2 partially-signed PSBTs`.
- Finalizer: Activity Log shows `Finalized: witness stacks assembled`.
- Extractor: A 64-character TXID and raw hex string are displayed.

---



## Scenario 2 — 3-of-5 Corporate Treasury (Alice + Carol + Eve)

Board-level multisig: 5 authorized signers, 3 required. Bob and Dave are deliberately skipped.

**Steps:**
1. Click **Reset**, then click **"3-of-5 Corporate Treasury"**.
2. Paste WIF keys for all five signers:
   ```
   Slot 0 — Alice: cW1A6frDQfrwayYo8AGukKx7zynJ6d5xfiBzzCFrKfmdCbFf75Nt
   Slot 1 — Bob:   cUFf5hUEwJ8JNFzcrtWgGYFrYoZqnH3qTb9kXfbwqHir5erY5Q78
   Slot 2 — Carol: cQUASk2BM9EDQqMoLEUXvVjS4ShUa82UnpCbbDa1gSAWeWi6nazU
   Slot 3 — Dave:  cThEsgDX4mqj219RyMahoKZAAvrosdz6gXk1hvszb5vv95tLTJuK
   Slot 4 — Eve:   cQanVUGYTsLXTLpFdFJYhZQhpGry31TdopVHXievLvePQfrv9Enr
   ```
3. Click **"Create PSBT"**.
4. Advance to **Updater** — review the derivation entries.
5. Advance to **Signer** — click **Sign** for **Alice** (slot 0), **Carol** (slot 2), and **Eve** (slot 4). Leave Bob and Dave unsigned.
6. Complete **Combiner → Finalizer → Extractor**.

**Input auto-filled by the scenario:**
```
TXID:   f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16
vout:   0
Amount: 500,000,000 sats  (5.0 BTC)
```

**Outputs auto-filled by the scenario:**
```
Output 0 — Vendor payment:    200,000,000 sats
Output 1 — Treasury change:   299,950,000 sats
Fee (implicit):                    50,000 sats
```

**What to verify:**
- Creator: Activity Log shows `5 user key(s), 0 generated`.
- Updater: 5 BIP-32 derivation entries displayed (`m/48'/0'/0'/2'/0` through `/4`).
- Signer: Alice, Carol, Eve show **SIGNED**. Bob and Dave show **AWAITING**.
- Combiner: Activity Log shows `Combined 3 partially-signed PSBTs`.
- Extractor: Valid TXID and raw hex.

---


## Scenario 3 — Single-sig Hardware Wallet

The simplest case: 1-of-1 P2WPKH. Only Alice signs. No witness script or multisig redeem script.

**Steps:**
1. Click **Reset**, then click **"Single-sig Hardware Wallet"**.
2. Paste Alice's WIF into slot 0:
   ```
   Slot 0 — Alice: cW1A6frDQfrwayYo8AGukKx7zynJ6d5xfiBzzCFrKfmdCbFf75Nt
   ```
3. Click **"Create PSBT"**.
4. Advance to **Updater** — note the reduced metadata compared to multisig.
5. Advance to **Signer** — click **Sign** for **Alice** (slot 0). No other slots are shown.
6. Complete **Combiner → Finalizer → Extractor**.

**Input auto-filled by the scenario:**
```
TXID:   a6f87c4ee39a97cdab55aef0b4e3c0fc26e6cee82bfdea94e54cf9a42c5e4a12
vout:   1
Amount: 5,000,000 sats  (0.05 BTC)
```

**Outputs auto-filled by the scenario:**
```
Output 0 — Payment:  4,990,000 sats
Fee (implicit):         10,000 sats
```

**What to verify:**
- Creator: Activity Log shows `1 user key(s), 0 generated`.
- Updater: Only 1 BIP-32 derivation entry. No witness script section (P2WPKH uses a pubkey hash, not a redeem script).
- Signer: Only Alice's slot is rendered.
- Combiner: Activity Log shows `Combined 1 partially-signed PSBTs`.
- Extractor: Valid TXID and raw hex.

---

## Scenario 4 — Import / Resume (partially-signed PSBT)

Tests PSBT portability: export after one signature, reset the app, re-import, and finish signing.

**Steps:**
1. Run Scenario 1 steps 1–5 but **sign Alice only** — do not click Sign for Bob.
2. In the sidebar export panel, select **Base64** format and copy the full string.
3. Click **Reset** to wipe all app state.
4. Paste the copied string into the **Import** textarea. Click **Import**.
5. Confirm the Inspector routes the app to the correct step automatically.
6. Navigate to **Signer**, paste Bob's WIF into slot 1, and click **Sign** for **Bob**:
   ```
   Slot 1 — Bob: cUFf5hUEwJ8JNFzcrtWgGYFrYoZqnH3qTb9kXfbwqHir5erY5Q78
   ```
7. Complete **Combiner → Finalizer → Extractor**.

**What to verify:**
- After import: Activity Log shows `Imported PSBT — jumped to combine`.
- Inspector analysis shows `totalSigs: 1` and `isFinalized: false`.
- Bob's SIGNED badge appears after signing.
- Final extracted transaction is valid and identical in structure to a full Scenario 1 run.

**Import format variants:**

| Format       | How to trigger                   | Expected behavior                              |
|--------------|----------------------------------|------------------------------------------------|
| Base64       | Paste the base64 export string   | Parses and routes correctly                    |
| Hex          | Paste the hex export string      | Detected automatically; parses and routes correctly |
| Garbage text | Type `notvalid!!!`               | Error: `Import failed: …`                      |

---

## Activity Log — expected entries (full Scenario 1 run)

These log messages should appear in order for a complete Scenario 1 run:

```
3 user key(s), 0 generated
Created 2-of-3 multisig: <testnet address>
PSBT created: 1 input(s), 2 output(s)
Updated with witness UTXOs, scripts, BIP-32 derivations
Alice signed 1 input(s) (user WIF)
Bob signed 1 input(s) (user WIF)
Combined 2 partially-signed PSBTs
Finalized: witness stacks assembled
Extracted raw tx: <txid>
```

