'use strict';

const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('./public'));
// for post
// change .get => .post
// change method="GET" => method="POST"
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', defaultHandler);
app.get('/searches', searchesHandler);
// app.get('/newSearches', newSearchHandler);



function defaultHandler(req, res) {
  res.status(200).render('pages/searches/show')
    .catch(() => {
      handleError(res);
    });
}

// function searchesHandler(req, res) {
//   res.status(200).render('pages/searches/show')
//     .catch(() => {
//       handleError(res);
//     });
// }

function newSearchHandler(req, res) {
  console.log('req.query >>>>>>>>> ', req.query);

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if (req.query.keyword === 'title') {
    url += `+intitle:${req.query.search}`;
  }

  if (req.query.keyword === 'author') {
    url += `+inauthor:${req.query.search}`;
  }

  console.log('==========================', url);
  superagent.get(url)
    .then(value => {
      console.log('value.body >>>>>>>>> ', value.body.items);
      const bookData = value.body.items;
      const books = bookData.map(value => {
        return new Book(value);
      });
      console.log('we are in the superagent ============');
      res.status(200).render('pages/books', { data: books });
    })
    .catch(() => {
      handleError(res);
    });
}

function handleError(res){
  return res.status(500).render('pages/error');
}



let placeholder = `https://i.imgur.com/J5LVHEL.jpg`;

function Book(data) {
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description || '*** Description current unavailable ***';
  this.thumbnail = data.volumeInfo.imageLinks.thumbnail || null;
}

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

