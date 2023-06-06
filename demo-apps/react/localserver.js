const express = require('express')
const app = express()
const port = 3000;

const path = require('path');

var public = path.join(__dirname, 'release');

app.use(express.static('release'));

app.get('/', function(req, res){
	 res.sendFile(path.join(public, 'imslib.js'));
});

app.get('/thin', function(req, res){
	 res.sendFile(path.join(public, 'imslib-thin.js'));
}); 

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})