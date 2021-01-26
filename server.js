'use strict';

// Bring in dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const cheerio = require('cheerio');
const $ = cheerio.load('views/layout/navbar');

// Start Application
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

client.on('error', err => {
  throw err;
});

// Routes
app.get('/', defaultHandler);
app.post('/apiSearch', apiSearchHandler);
app.get('/books/:id', viewDetailsHandler);
app.post('/books', booksHandler);
app.delete('/delete/:id', deleteHandler);
app.get('/edit/:id', editHandler);
app.get('/newSearch', newSearchHandler);
app.put('/update', updateHandler);



// Handlers
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

      res.status(200).redirect('/');
    });

  //   let retrieveBook = 'SELECT * FROM books WHERE title = $1';
  //   let values = [req.body.title];
  //   client.query(retrieveBook, values)
  //     .then(results => {
  //       let details = results.rows[0];
  //       res.status(200).render('pages/books/show', { data: details }
  //       );
  //     });
}

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

function deleteHandler(req, res) {
  let SQL = 'DELETE FROM books WHERE id= $1';
  let values = [req.params.id];

  client.query(SQL, values)
    .then(() => {
      res.status(200).redirect('/');
    });
}

function editHandler(req, res) {
  let SQL = 'SELECT * FROM books WHERE id = $1';
  let values = [req.params.id];

  client.query(SQL, values)
    .then(results => {
      let details = results.rows[0];
      res.status(200).render('pages/edit', { data: details });
    });
}

function handleError(res) {
  return res.status(500).render('pages/error');
}

function newSearchHandler(req, res) {
  res.status(200).render('pages/searches/new');
}

function updateHandler(req, res) {
  let SQL = `UPDATE books
             SET title = $1, 
                author = $2,
                description = $3,
                thumbnail = $4, 
                isbn = $5, 
                bookshelf = $6 
             WHERE id = $7`;
  let safeValues = [req.body.title, req.body.author, req.body.description, req.body.thumbnail, req.body.isbn, req.body.bookshelf, req.body.id];

  client.query(SQL, safeValues)
    .then(() => {
      res.status(200).redirect('/');
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
