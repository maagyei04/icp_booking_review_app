# Book Review Application

## Description

The Book Review Application allows users to browse and review books, manage their account details, and perform transactions related to book purchases and reviews.

## Functions Overview

### `isRegistered` Function

Verifies whether a Principal has an account. Used for conditional rendering and input validation.

### `getAccount` Function

Fetches the account data of the caller.

### `getCallerRequests` Function

Fetches all requests of the caller.

### `getCanisterId` Function

Fetches the ID of the backend/bank canister.

### `createAccount` Function

Allows the caller to create an account if none exists.

### `createTransferRequest` Function

Allows the caller to create a transfer request to another user.

### `handleTransferRequest` Function

Allows the receiver to handle a transfer request (approve/reject).

### `transferFrom` Function

Allows the caller to transfer tokens to a Principal.

### `handleGetFee` Function

Fetches the current fee of the ledger canister.

### `handleGetAllowance` Function

Fetches the current allowance of the backend/bank canister.

### `handleTransferFrom` Function

Carries out the `transferFrom` operation used for handling transfers.

## Deployment Instructions

To deploy the Book Review Application canisters, follow these steps:

1. **Start DFX Environment:**
dfx start --background --clean


2. **Deploy Ledger Canister:**
./deploy-local-ledger.sh


3. **Deploy ICRC Ledger Canister:**
./deploy-local-icrc-ledger.sh


4. **Deploy Internet Identity:**
dfx deploy internet_identity


5. **Generate Types Declarations:**
dfx generate icp_booking_review_backend


6. **Deploy Backend Canister:**
dfx deploy icp_booking_review_backend


7. **Deploy Frontend Canister:**
dfx deploy icp_booking_review_frontend


7. **Transfer Tokens to Principal:**
dfx identity use default
dfx ledger transfer <ADDRESS> --memo 0 --icp 100

Replace `<ADDRESS>` with the address of the recipient. Use `getAddressFromPrincipal(principal: Principal)` function to obtain the address.

## Additional Notes

- Adjust paths and environment variables (`BACKEND_CANISTER_ID`, etc.) in your application as per your setup.
- Ensure all dependencies and configurations are correctly set up before deployment.
- For more detailed documentation, refer to individual function implementations and canister descriptions.
