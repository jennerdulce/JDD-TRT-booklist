DROP TABLE IF EXISTS books;
CREATE TABLE books (
  id SERIAL PRIMARY KEY, 
  title VARCHAR,
  author VARCHAR,
  description TEXT,
  thumbnail TEXT, 
  isbn TEXT, 
  bookshelf TEXT
);