'use strict';

// Bring in dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

// Start Application
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

client.on('error', err => {
  throw err;
});

// Routes
app.get('/', defaultHandler);
app.get('/books/:id', viewDetailsHandler);
app.post('/books', booksHandler);
app.get('/newSearch', newSearchHandler);
app.post('/apiSearch', apiSearchHandler);


// Handlers
function defaultHandler(req, res) {
  let SQL = 'SELECT * FROM books';
  client.query(SQL)
    .then(results => {
      let databaseBooks = results.rows;
      res.status(200).render('pages/index', { data: databaseBooks });
    })
    .catch(err => {
      console.log(err);
    });

}

function viewDetailsHandler(req, res) {
  let SQL = 'SELECT * FROM books WHERE id = $1';
  let values = [req.params.id];

  client.query(SQL, values)
    .then(results => {
      let details = results.rows[0];
      console.log(details);
      res.status(200).render('pages/books/show', { data: details });
    })
    .catch(err => {
      console.log(err);
    });

}

function newSearchHandler(req, res) {
  res.status(200).render('pages/searches/new');
}

function apiSearchHandler(req, res) {
  console.log('req.body >>>>>>>>> ', req.body);

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if (req.body.keyword === 'title') {
    url += `+intitle:${req.body.search}`;
  }

  if (req.body.keyword === 'author') {
    url += `+inauthor:${req.body.search}`;
  }

  // console.log('==========================', url);
  superagent.get(url)
    .then(value => {
      // console.log('value.body >>>>>>>>> ', value.body.items);
      const bookData = value.body.items;
      const books = bookData.map(value => {
        return new Book(value.volumeInfo);
      });
      console.log(books);
      // console.log('we are in the superagent ============');
      res.status(200).render('pages/searches/results', { data: books });
    })
    .catch(err => {
      // handleError(res);
      console.log(err);
    });

}

function booksHandler(req, res) {
  let SQL = `INSERT INTO books
            (title, author, description, thumbnail, isbn, bookshelf)
            VALUES ($1, $2, $3, $4, $5, $6);`;
  let safeValues = [req.body.title, req.body.author, req.body.description, req.body.thumbnail, req.body.isbn, req.body.bookshelf];
  client.query(SQL, safeValues)
    .then(() => {
      console.log(`${req.body.title} added to your favorites list!`);
    });

  let retrieveBook = 'SELECT * FROM books WHERE title = $1';
  let values = [req.body.title];
  client.query(retrieveBook, values)
    .then(results => {
      let details = results.rows[0];
      res.status(200).render('pages/books/show', { data: details }
      );
    });
}

function handleError(res) {
  return res.status(500).render('pages/error');
}

// let placeholder = `https://i.imgur.com/J5LVHEL.jpg`;
function Book(data) {
  this.title = data.title;
  this.author = data.authors;
  this.description = data.description || '*** Description current unavailable ***';
  this.thumbnail = data.imageLinks.thumbnail || null;
  this.isbn = data.industryIdentifiers[0].identifier;
  this.bookshelf = data.categories;
}


client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`);
      console.log('Connected to database:', client.connectionParameters.database);
    });
  }).catch(err => console.log(err));

