import { approve } from "./icrc2_ledger";
import { createCanisterActor } from "./canisterFactory";
import { idlFactory as bookReviewIDL } from "../../../declarations/book_review_canister/book_review_canister.did.js";  // Adjust path and name as per your actual canister
import IcHttp from "./ichttp";

const bookReviewCanister = await createCanisterActor(process.BACKEND_CANISTER_ID, bookReviewIDL);

const httpClient = new IcHttp(bookReviewCanister);

export async function createBook(data) {
  return httpClient.POST({ path: "/books", data });
}

export async function getBooks(data) {
  return httpClient.GET({ path: "/books/:id", data });
}

export async function createBookReview(data) {
  return httpClient.POST({ path: "/books/:id/reviews", data });
}

export async function getBookReviews() {
  return httpClient.GET({ path: "/bookreviews" }); 
}

export async function deleteBook() {
  return httpClient.DELETE({ path: "/books/:id" }); 
}


