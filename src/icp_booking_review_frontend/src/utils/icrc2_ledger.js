import { createCanisterActor } from "./canisterFactory";
import { getPrincipalText, isAuthenticated } from "./auth";
import { idlFactory as bookReviewIDL } from "../../../declarations/book_review_canister/book_review_canister.did.js";
import { Principal } from "@dfinity/principal";

const BOOK_REVIEW_CANISTER_ID = "abcdef-aaaaa-aaaaa-aaaaa-cai";

export async function approve(spender, amount) {
    const canister = await getBookReviewCanister();
    const currentPrincipal = await getPrincipalText();
    try {
        const response = await canister.approve({
            spender: { owner: Principal.fromText(spender), subaccount: [] },
            from: { owner: Principal.fromText(currentPrincipal), subaccount: [] },
            amount: BigInt(amount),
            fee: [],
            memo: [],
            from_subaccount: [],
            created_at_time: [],
            expected_allowance: [],
            expires_at: []
        });
        return response;
    } catch (err) {
        console.error("Error in approve function:", err);
        throw new Error("Failed to approve transaction");
    }
}

export async function tokenBalance() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        return "";
    }
    const canister = await getBookReviewCanister();
    const principal = await getPrincipalText();
    try {
        const balance = await canister.token_balance({ owner: Principal.fromText(principal), subaccount: [] });
        return balance.toString();
    } catch (err) {
        console.error("Error fetching token balance:", err);
        throw new Error("Failed to fetch token balance");
    }
}

export async function tokenSymbol() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        return "";
    }
    const canister = await getBookReviewCanister();
    try {
        const symbol = await canister.token_symbol();
        return symbol;
    } catch (err) {
        console.error("Error fetching token symbol:", err);
        throw new Error("Failed to fetch token symbol");
    }
}

async function getBookReviewCanister() {
    return createCanisterActor(BOOK_REVIEW_CANISTER_ID, bookReviewIDL);
}
