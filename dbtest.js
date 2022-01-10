const port = 80
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const MONGO_URL = 'mongodb://127.0.0.1:27017/test' // 이 부분 ssh로 접속한 서버 ip로 바꿔야함. 그 전에 ssh 서버에 몽고디비 깔아놓기도 하고!
const userSchema = new mongoose.Schema({
  name:String,
  win:Number,
  lose:Number
})
const User = mongoose.model("users", userSchema)
const { handle } = require('express/lib/router')
mongoose
  .connect(MONGO_URL)
  .then(() => console.log('MongoDB conected'))
  .catch((err) => {
    console.log(err);
  });

//만약에 유저 이름이 db에 있다면 db에서 정보 불러오고, 유저 이름이 db에 없다면 db에 정보 저장.
  
// User.find({name:username})
// .then(() => {
//   //정보불러오기
//   console.log(`Welcome the ${username}!`)
// })
// .catch((err) => {
//   User.create({name:username, win:"0", lose:"0"})
//   console.log('Welcome the new user!')
//   User.불러오고
// });
// User.create({ name: 'aaa',win:3,lose:3}, function (err, awesome_instance) {
//     if (err) return handleError(err);
//     // saved!
// })
// const res = User.updateOne({'name':'junseo'},{'win':100},function (error, writeOpResult){
//     if(error)return handleError(error);
//     console.log(`upd finish`);
// });

// async function myfunc(){
//     try{
//         await User.create({ name: 'eee',win:3,lose:3}, function (err, awesome_instance) {
//             if (err) return handleError(err);
//             // saved!
//         })
//         await User.findOne({ 'name': 'eee' }, function (err, person) {
//             if (err) return handleError(err);
//             if(person==null){
//                 console.log('null!')
//                 return;
//             }
//             // Prints "Space Ghost is a talk show host".
//             console.log('%d win %d lose', person.win, person.lose);
//         }).clone();
//     }
//     catch(error){
//         console.error(error);
//     }
// }

//myfunc();

// User.findOne({ 'name': 'aaa' }, function (err, person) {
//       if (err) return handleError(err);
//       if(person==null)return;
//       // Prints "Space Ghost is a talk show host".
//       console.log('%d win %d lose', person.win, person.lose);
//   })
//User.findOneAndUpdate({"name":'aaa'},{$inc:{"win":1}})
// async function mm(){
//   User.findOneAndUpdate({"name":'aaa'},{$inc:{"win":1}}).then(()=>
//   User.findOne({ 'name': 'aaa' }, function (err, person) {
//           if (err) return handleError(err);
//           if(person==null)return;
//           // Prints "Space Ghost is a talk show host".
//           console.log('%d win %d lose', person.win, person.lose);
//       }).clone()
//   )
// }
// mm();

User.find({},(err,docs)=>{
  console.log(docs.length);
})