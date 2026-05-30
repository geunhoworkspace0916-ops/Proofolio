# Proofolio

Proofolio is a Sepolia dApp for verifiable career, education, project, and award credentials. Verified issuers mint non-transferable ERC-721 credentials to holders, and anyone can verify the issuer, revocation status, and original-file hash from a QR link without connecting a wallet.

## Core Value

Proofolio shifts trust from editable PDFs or private databases to public on-chain issuance records. The certificate file stays off-chain; the blockchain stores the issuer address, holder address, file hash, credential type, issue time, and revocation status.

## Features

- Admin: register verified issuers and activate/deactivate them.
- Issuer: hash an original file in the browser and issue a soulbound credential to a holder.
- Holder: view owned credentials, copy verification links, and show QR codes.
- Verifier: open `/verify/{tokenId}` without a wallet, check issuance status, and compare an uploaded original file hash against the on-chain hash.
- Public issuer profile: view issuer name, address, status, registration date, and issued credential count.

## Stack

- Frontend: Vite, React 19, TypeScript, Tailwind CSS, ethers v6, MetaMask.
- Smart contracts: Solidity 0.8.28, OpenZeppelin ERC-721, Ownable2Step, Hardhat.
- Network: Ethereum Sepolia.
- Web deployment: Cloudflare Pages with Wrangler.

## Contract

- Sepolia Proofolio: `0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2`
- Etherscan: https://sepolia.etherscan.io/address/0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2

## Demo URL

- Cloudflare Pages: TBD after `npm run pages:deploy`

## Setup

```bash
npm install
cp .env.example .env
```

Set these values in `.env`:

```bash
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
VITE_CONTRACT_ADDRESS=0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Only `VITE_*` values are bundled into the frontend. Never commit `.env` or private keys.

## Local Development

```bash
npm run dev
npm run build
npm run lint
npx hardhat compile
npx hardhat test
```

## Contract Deployment

Deploy to Sepolia after `.env` is configured:

```bash
npm run deploy:sepolia
```

Verify the deployed contract on Etherscan:

```bash
npx hardhat verify --network sepolia 0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2
```

`hardhat.config.ts` reads `ETHERSCAN_API_KEY` for Sepolia verification.

## Cloudflare Pages

Preview the Pages build locally:

```bash
npm run pages:preview
```

Deploy manually:

```bash
npm run pages:deploy
```

Set `VITE_SEPOLIA_RPC_URL`, `VITE_CONTRACT_ADDRESS`, and optionally `VITE_CONTRACT_DEPLOY_BLOCK` as Cloudflare Pages environment variables before production builds.

## Why Blockchain

Proofolio uses blockchain because the product needs public, tamper-resistant, independently verifiable issuance records. A verifier should not have to trust Proofolio's database or a copied PDF. They can check that a registered issuer address issued a credential to a holder, that it has not been revoked, and that the submitted original file hashes to the same on-chain `dataHash`.

## Trust Model and Limits

Blockchain guarantees that a registered issuer address issued a credential at a recorded time, that the record was not silently edited later, and that a changed original file will produce a different hash. It does not guarantee the holder's real-world skill, the real-world legitimacy of an issuer, or that the issuer entered truthful data at issue time. Issuer names are self-reported strings; the trust anchor is the issuer address plus admin registry status. Personal information must not be stored in `credType` or metadata URIs because on-chain data is public and permanent.
