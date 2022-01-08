// const app = require('express')();
// const http = require('http').createServer(app);

// // http://172.10.5.101/
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// http.listen(80, () => {
//     console.log('connected at 80');
// });


const express = require('express');
const app = express();

let users = [
  {
    id: 1,
    name: 'alice'
  },
  {
    id: 2,
    name: 'bek'
  },
  {
    id: 3,
    name: 'chris'
  }
]

app.get('/users', (req, res) => {
   console.log('who get in here/users');
   res.json(users)
});

app.post('/post', (req, res) => {
   console.log('who get in here post /users');
   var inputData;

   req.on('data', (data) => {
     inputData = JSON.parse(data);
   });

   req.on('end', () => {
     console.log("user_id : "+inputData.user_id + " , name : "+inputData.name);
   });

   res.write("OK!");
   res.end();
});

app.listen(443, () => {
  console.log('Example app listening on port 3000!');
});
