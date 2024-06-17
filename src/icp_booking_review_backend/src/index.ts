import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, Principal, Result } from 'azle';
import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';  // For authentication

// Constants
const ICRC_CANISTER_PRINCIPAL = "mxzaz-hqaaa-aaaar-qaada-cai";
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';  // Should be stored in environment variables
const PORT = process.env.PORT || 3000;

// Classes
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

// Data storage
const booksStorage = new StableBTreeMap<string, Book>(0);

// Middleware for JWT authentication
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Custom error types
class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

// Server initialization
export default Server(() => {
    const app = express();
    app.use(cors({ origin: 'http://example.com' }));  // Update with your allowed origin
    app.use(express.json());

    // Routes
    app.get("/books", async (req, res) => {
        try {
            const books = await booksStorage.values();
            res.json(books);
        } catch (error) {
            res.status(500).send('Internal Server Error');
        }
    });

    app.get("/books/:id", async (req, res) => {
        try {
            const bookId = req.params.id;
            const existingBook = await booksStorage.get(bookId);
            if (!existingBook) {
                throw new NotFoundError(`Book with id=${bookId} not found`);
            }
            res.json(existingBook);
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(404).send(error.message);
            } else {
                res.status(500).send('Internal Server Error');
            }
        }
    });

    app.post("/books", authenticateToken, [
        body('title').isString().trim().escape(),
        body('author').isString().trim().escape(),
        body('description').isString().trim().escape()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, author, description } = req.body;
            const bookId = uuidv4();
            const newBook = new Book(bookId, title, author, description);
            await booksStorage.insert(newBook.id, newBook);
            res.json(newBook);
        } catch (error) {
            res.status(500).send('Internal Server Error');
        }
    });

    app.post("/books/:id/reviews", [
        body('reviewer').isString().trim().escape(),
        body('rating').isInt({ min: 1, max: 5 }),
        body('comment').isString().trim().escape()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const bookId = req.params.id;
            const { reviewer, rating, comment } = req.body;
            const existingBook = await booksStorage.get(bookId);
            if (!existingBook) {
                throw new NotFoundError(`Book with id=${bookId} not found`);
            }
            const reviewId = uuidv4();
            const newReview = new Review(reviewId, reviewer, rating, comment);
            existingBook.reviews.push(newReview);
            await booksStorage.insert(existingBook.id, existingBook);
            res.json(newReview);
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(404).send(error.message);
            } else {
                res.status(500).send('Internal Server Error');
            }
        }
    });

    app.delete("/books/:id", authenticateToken, async (req, res) => {
        try {
            const bookId = req.params.id;
            const deletedBook = await booksStorage.remove(bookId);
            if (!deletedBook) {
                throw new NotFoundError(`Book with id=${bookId} not found`);
            }
            res.json(deletedBook);
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(404).send(error.message);
            } else {
                res.status(500).send('Internal Server Error');
            }
        }
    });

    // Start server
    return app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
