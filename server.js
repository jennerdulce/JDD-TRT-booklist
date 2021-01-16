'use strict';

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.get('/', defaultHandler);
app.get('/searches/new', searchHandler);


function defaultHandler(req, res){
  res.status(200).render('index');
}

function searchHandler(req, res){
  //
}


app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

