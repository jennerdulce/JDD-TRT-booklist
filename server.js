'use strict';

const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.get('/', defaultHandler);
app.get('/searches', searchHandler);
app.get('/books', searchHandler);



function defaultHandler(req, res){
  res.status(200).render('index');
}

function searchHandler(req, res){
  console.log('req.query >>>>>>>>> ', req.query);

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if (req.query.search[1] === 'title'){
    url += `+intitle:${req.query.search[1]}`;
  }

  if (req.query.search[1] === 'author'){
    url += `+inauthor:${req.query.search[1]}`;
  }

  superagent.get(url)
    .then(value => {
      console.log('value.body >>>>>>>>> ', value.body.items[0]);
      const bookData = value.body.items;
      const books = bookData.map(value => {
        return new Book(value);
      });
      console.log('we are in the superagent ============');
      res.status(200).render('books', {data: books});
    });
}

let placeholder = `https://i.imgur.com/J5LVHEL.jpg`;

function Book(data){
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  // this.thumbnail = data.volumeInfo.imageLinks.thumbnail || null;
}







app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

