'use strict';

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.get('/', defaultHandler);

function defaultHandler(req, res){
  res.status(200).render('index');
}


app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

