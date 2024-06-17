import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic, Principal, serialize, Result } from 'azle';
import express from 'express';
import cors from 'cors';

/**
 * This class represents a Book for the book review application.
 * It contains basic properties needed to define a book.
 */
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

/**
 * This class represents a Review for a Book.
 * It contains properties for the reviewer, rating, and comments.
 */
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

const booksStorage = StableBTreeMap<string, Book>(0);

const ICRC_CANISTER_PRINCIPAL = "mxzaz-hqaaa-aaaar-qaada-cai";

export default Server(() => {
    const app = express();
    app.use(cors());
    app.use(express.json());

app.get("/books", (req, res) => {
    res.json(booksStorage.values());
});

app.get("/books/:id", (req, res) => {
    const bookId = req.params.id;
    const bookOpt = booksStorage.get(bookId);
    if ("None" in bookOpt) {
        res.status(404).send(`Book with id=${bookId} not found`);
    } else {
        res.json(bookOpt.Some);
    }
});

app.post("/books", (req, res) => {
    const { title, author, description } = req.body;
    const bookId = uuidv4();
    const newBook = new Book(bookId, title, author, description);
    booksStorage.insert(newBook.id, newBook);
    res.json(newBook);
});

app.post("/books/:id/reviews", (req, res) => {
    const bookId = req.params.id;
    const { reviewer, rating, comment } = req.body;
    const bookOpt = booksStorage.get(bookId);
    if ("None" in bookOpt) {
        res.status(404).send(`Book with id=${bookId} not found`);
    } else {
        const book = bookOpt.Some;
        const reviewId = uuidv4();
        const newReview = new Review(reviewId, reviewer, rating, comment);
        book.reviews.push(newReview);
        booksStorage.insert(book.id, book);
        res.json(newReview);
    }
});

app.delete("/books/:id", (req, res) => {
    const bookId = req.params.id;
    const deletedBookOpt = booksStorage.remove(bookId);
    if ("None" in deletedBookOpt) {
        res.status(404).send(`Book with id=${bookId} not found`);
    } else {
        res.json(deletedBookOpt.Some);
    }
});

return app.listen();
});
