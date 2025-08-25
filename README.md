# WASM Demo App

A demonstration web app showing how to implement Bitcoin payments via Lightning using the [Breez SDK - Nodeless](https://sdk-doc-liquid.breez.technology/) with WebAssembly. 

See it in action [here](https://wasm-example-app.vercel.app/). 

Note: this is just a demo, for production usage, check out the security notes below.

## Overview

Built with React, this demo app showcases best practices for integrating Lightning in a web environment using the Breez SDK’s WebAssembly bindings. It enables users to:

- Connect with a mnemonic seed phrase
- Send Lightning payments using Bolt11 invoices
- Receive Lightning payments by generating invoices
- View transaction history
- View detailed payment information

## Technologies Used

- React with TypeScript
- Tailwind CSS for styling
- [Breez SDK - Nodeless](https://sdk-doc-liquid.breez.technology/) for Lightning payments

## Prerequisites

You'll need a **Nodeless** Breez API key for the SDK to work — you can request one for free [here](https://breez.technology/request-api-key/#contact-us-form-sdk).

## Getting Started

### Clone the repository

```bash
git clone https://github.com:breez/wasm-example-app.git
cd wasm-example-app
```

### Install dependencies

```bash
npm install
```

### Set up environment variables

1. Create a `.env.local` file in the project root
2. Add your Breez API key:

```
VITE_BREEZ_API_KEY="your_breez_api_key_here"
```

### Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Project Structure

```
/src
  /components        # UI components
    /ui              # Reusable UI component library
  /contexts          # React context providers
  /services          # Business logic and API communication
  App.tsx            # Main application component
  main.tsx           # Application entry point
  index.css          # Global styles
/pkg                 # WebAssembly bindings for Breez SDK
```

## Key Components

- **walletService.ts** - Handles communication with the Breez SDK
- **SendPaymentDialog** - Dialog for making Lightning payments
- **ReceivePaymentDialog** - Dialog for generating invoices
- **PaymentDetailsDialog** - Shows detailed information about transactions


## Security Notes

- The app stores your mnemonic in localStorage, which is not suitable for production use
- For a production app, use secure storage and encryption for sensitive data
