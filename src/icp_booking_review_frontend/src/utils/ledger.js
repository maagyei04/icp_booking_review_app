import { createCanisterActor } from "./canisterFactory";
import { getPrincipalText, isAuthenticated, logout } from "./auth";
import { createCanisterActor } from "./canisterFactory";
import { getPrincipalText, isAuthenticated, logout } from "./auth";
import { idlFactory as bookReviewIDL } from "../../../declarations/book_review_canister/book_review_canister.did.js";

const BOOK_REVIEW_CANISTER_ID = "abcdef-aaaaa-aaaaa-aaaaa-cai";

export async function getUserReviews(userId) {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        throw new Error("User is not authenticated");
    }
    const canister = await getBookReviewCanister();
    const principal = await getPrincipalText();
    try {
        const reviews = await canister.get_user_reviews(principal, userId);
        return reviews;
    } catch (err) {
        console.error("Error fetching user reviews:", err);
        throw new Error("Failed to fetch user reviews");
    }
}

export async function addReview(bookId, rating, comment) {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        throw new Error("User is not authenticated");
    }
    const canister = await getBookReviewCanister();
    const principal = await getPrincipalText();
    try {
        const result = await canister.add_review(principal, bookId, rating, comment);
        return result;
    } catch (err) {
        console.error("Error adding review:", err);
        throw new Error("Failed to add review");
    }
}

async function getBookReviewCanister() {
    return createCanisterActor(BOOK_REVIEW_CANISTER_ID, bookReviewIDL);
}