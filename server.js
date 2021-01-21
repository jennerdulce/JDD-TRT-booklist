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

client.on('error', err => console.log(err));

// Routes
app.get('/', defaultHandler);
app.get('/books/:id', bookDetails);
app.post('/newSearches', newSearchHandler);


// Handlers
function defaultHandler(req, res) {
  let SQL = 'SELECT * FROM books';
  client.query(SQL)
    .then(results => {
      let databaseBooks = results.rows;
      res.status(200).render('pages/index', { data: databaseBooks });
    })
    .catch(err => {
      handleError(res);
      throw err;
    });
}

function bookDetails (req, res) {
  let SQL = 'SELECT * FROM books WHERE id = $1';
  let values = [req.params.id];

  client.query(SQL, values)
    .then( results => {
      let details = results.rows[0];
      console.log(details);
      res.status(200).render('pages/books/show', { data: details});
    })
    .catch(err => {
      handleError(res);
      throw err;
    });

}

function newSearchHandler(req, res) {
  // console.log('req.query >>>>>>>>> ', req.body);

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
        return new Book(value);
      });
      // console.log('we are in the superagent ============');
      res.status(200).render('pages/searches/new', { data: books });
    })
    .catch(() => {
      handleError(res);
      throw err;
    });
}

function handleError(res){
  return res.status(500).render('pages/error');
}

// let placeholder = `https://i.imgur.com/J5LVHEL.jpg`;

function Book(data) {
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description || '*** Description current unavailable ***';
  this.thumbnail = data.volumeInfo.imageLinks.thumbnail || null;
  this.isbn = data.volumeInfo.industryIdentifiers[0].identifier;
  this.bookshelf = data.volumeInfo.mainCategory;
}


client.connect()
  .then( () => {
    app.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`);
      console.log('Connected to database:', client.connectionParameters.database);
    });
  });

