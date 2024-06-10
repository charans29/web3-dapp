# Web3-dapp: A Data Labeling Platform

## Overview

This platform leverages Web3 technologies to create a decentralized data labeling and crowdsourced task system. Users can submit tasks with descriptions and images and offer rewards in SOL, while workers can complete these tasks to earn SOL. The system integrates with Phantom Wallet for secure and seamless Solana blockchain interactions.

## Features

- Connect to Phantom Wallet for signing and transactions.
- Submit tasks with descriptions and images.
- Set bounties in SOL for task completion.
- Workers can accept tasks and earn SOL upon completion.
- Secure backend for handling on-chain transactions.

## Prerequisites

- Node.js and npm installed.
- Phantom Wallet browser extension.
- Solana CLI and wallet setup.
- PostgreSQL database.
- AWS CLI configured with AWS services.

## Installation

Navigate to each project directory and install the required dependencies:

```bash
# Install backend dependencies
cd backend && npm install

# Install user frontend dependencies
cd user-frontend && npm install

# Install worker frontend dependencies
cd worker-frontend && npm install
```

# Usage Instructions

## Backend

To start the backend server, navigate to the `backend` directory:
```bash
cd backend
tsc -b
node dist/index.js
```

## User Frontend

To submit tasks, first navigate to the user-frontend directory and start the frontend application:
```bash
cd user-frontend
npm run dev
```

## Steps for Users:
Connect your Phantom Wallet using the "Connect Wallet" button on the UI.
Fill in the task description in the provided input field.
Upload the required images using the file upload interface.
Submit the task along with the SOL payment by following the UI prompts.

## Worker Frontend
Workers can access and complete tasks by navigating to the worker-frontend directory and starting the frontend application:
```bash
cd worker-frontend
npm run dev
```

## Steps for Workers:
Connect your Phantom Wallet using the "Connect Wallet" button on the UI.
View the list of available tasks and accept one that you wish to work on.
Complete the task according to the provided instructions.
Request payouts for your completed tasks through the UI interface.

## Configuration

Backend
Provide the RPC API endpoint and parent wallet addresses in the user.ts and worker.ts files within the backend/src directory.

For user.ts:
const PARENT_WALLET_ADDRESS = 'YourParentWalletPublicKeyHere';

For worker.ts:
const PARENT_WALLET_ADDRESS = 'YourParentWalletPublicKeyHere';

Remember to replace 'YourParentWalletPublicKeyHere' with the actual public key of the parent wallet that will be used to receive and send SOL.
