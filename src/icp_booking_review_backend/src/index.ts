import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic, Principal, serialize, Result } from 'azle';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // For token validation
import sanitize from 'sanitize-html'; // For sanitizing user input
import {
 hexAddressFromPrincipal
} from "azle/canisters/ledger";

const JWT_SECRET = 'your-secure-jwt-secret'; // Replace with a secure secret key

// This class represents a Book for the book review application.
class Book {
    id: string;
    title: string;
    author: string;
    description: string;
    reviews: Review[];

    constructor(id: string, title: string, author: string, description: string) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.description = description;
        this.reviews = [];
    }
}

// This class represents a Review for a Book.
class Review {
    id: string;
    reviewer: string;
    rating: number;
    comment: string;

    constructor(id: string, reviewer: string, rating: number, comment: string) {
        this.id = id;
        this.reviewer = reviewer;
        this.rating = rating;
        this.comment = comment;
    }
}

// Stable storage for books
const booksStorage = StableBTreeMap<string, Book>(0);

// Constants
const ICRC_CANISTER_PRINCIPAL = "mxzaz-hqaaa-aaaar-qaada-cai";

// Middleware for logging actions
function logAction(action: string, details: any) {
    console.log(`[${new Date().toISOString()}] ${action}:`, details);
}

// Middleware for input validation
function validateBookPayload(payload: any): boolean {
    return payload.title && payload.author && payload.description;
}

function validateReviewPayload(payload: any): boolean {
    return payload.reviewer && payload.rating && payload.comment;
}

// Middleware for authorization using JWT
function authorize(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send('Forbidden: No token provided');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized: Invalid token');
        }
        req.user = decoded;
        next();
    });
}

// Sanitize user input to prevent XSS attacks
function sanitizeInput(input: any): any {
    if (typeof input === 'string') {
        return sanitize(input);
    } else if (typeof input === 'object' && input !== null) {
        for (const key in input) {
            input[key] = sanitizeInput(input[key]);
        }
    }
    return input;
}

export default Server(() => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Apply authorization middleware to all routes
    app.use(authorize);

    // Get all books with pagination
    app.get("/books", (req, res) => {
        const { offset = 0, limit = 10 } = req.query;
        const books = booksStorage.values().slice(offset, offset + limit);
        res.json(books);
    });

    /*
        a helper function to get address from the principal
        the address is later used in the transfer method
    */
    app.get("/principal-to-address/:principalHex", (req, res) => {
            const principal = Principal.fromText(req.params.principalHex);
            res.json({account: hexAddressFromPrincipal(principal, 0)});
    });

    // Get a book by id
    app.get("/books/:id", (req, res) => {
        const bookId = req.params.id;
        const bookOpt = booksStorage.get(bookId);
        if ("None" in bookOpt) {
            res.status(404).send(`Book with id=${bookId} not found`);
        } else {
            res.json(bookOpt.Some);
        }
    });

    // Add a new book
    app.post("/books", (req, res) => {
        const { title, author, description } = sanitizeInput(req.body);
        if (!validateBookPayload(req.body)) {
            return res.status(400).send("Invalid book payload");
        }
        const bookId = uuidv4();
        const newBook = new Book(bookId, title, author, description);
        booksStorage.insert(newBook.id, newBook);
        logAction("add_book", newBook);
        res.json(newBook);
    });

    // Add a review to a book
    app.post("/books/:id/reviews", (req, res) => {
        const bookId = req.params.id;
        const { reviewer, rating, comment } = sanitizeInput(req.body);
        if (!validateReviewPayload(req.body)) {
            return res.status(400).send("Invalid review payload");
        }
        const bookOpt = booksStorage.get(bookId);
        if ("None" in bookOpt) {
            res.status(404).send(`Book with id=${bookId} not found`);
        } else {
            const book = bookOpt.Some;
            const reviewId = uuidv4();
            const newReview = new Review(reviewId, reviewer, rating, comment);
            book.reviews.push(newReview);
            booksStorage.insert(book.id, book);
            logAction("add_review", { bookId, review: newReview });
            res.json(newReview);
        }
    });

    // Update a review of a book
    app.put("/books/:bookId/reviews/:reviewId", (req, res) => {
        const bookId = req.params.bookId;
        const reviewId = req.params.reviewId;
        const { reviewer, rating, comment } = sanitizeInput(req.body);
        if (!validateReviewPayload(req.body)) {
            return res.status(400).send("Invalid review payload");
        }
        const bookOpt = booksStorage.get(bookId);
        if ("None" in bookOpt) {
            res.status(404).send(`Book with id=${bookId} not found`);
        } else {
            const book = bookOpt.Some;
            const review = book.reviews.find(review => review.id === reviewId);
            if (!review) {
                return res.status(404).send(`Review with id=${reviewId} not found`);
            }
            review.reviewer = reviewer;
            review.rating = rating;
            review.comment = comment;
            booksStorage.insert(book.id, book);
            logAction("update_review", { bookId, review });
            res.json(review);
        }
    });

    // Delete a book
    app.delete("/books/:id", (req, res) => {
        const bookId = req.params.id;
        const deletedBookOpt = booksStorage.remove(bookId);
        if ("None" in deletedBookOpt) {
            res.status(404).send(`Book with id=${bookId} not found`);
        } else {
            logAction("delete_book", deletedBookOpt.Some);
            res.json(deletedBookOpt.Some);
        }
    });

    // Delete a review from a book
    app.delete("/books/:bookId/reviews/:reviewId", (req, res) => {
        const bookId = req.params.bookId;
        const reviewId = req.params.reviewId;
        const bookOpt = booksStorage.get(bookId);
        if ("None" in bookOpt) {
            res.status(404).send(`Book with id=${bookId} not found`);
        } else {
            const book = bookOpt.Some;
            const initialLength = book.reviews.length;
            book.reviews = book.reviews.filter(review => review.id !== reviewId);
            if (initialLength === book.reviews.length) {
                res.status(404).send(`Review with id=${reviewId} not found`);
            } else {
                booksStorage.insert(book.id, book);
                logAction("delete_review", { bookId, reviewId });
                res.json(book);
            }
        }
    });

    return app.listen();
});
