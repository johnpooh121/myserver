const express = require('express')
const { use } = require('express/lib/application')
const mongoose = require('mongoose')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)

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


const randomstring = require('randomstring')
const { emit } = require('process')
let rcnt=[],p1name=[],p2name=[],readycnt=[],pname_bysid=[],isroomover=[],isroomoccupied=[]

// 소켓 연결 코드
io.sockets.on('connection', (socket) => {
  console.log(`Socket connected : ${socket.id}`)
  let myroomnumber,myusername;
    let isrefused,isranking;
  socket.on('getmystatus',(data)=>{
    const receivedata = JSON.parse(data);
    const username = receivedata.username;
    let detail="",win,lose
    isranking =false
    User.findOne({ 'name': username }, function (err, person) {
          if (err) return handleError(err);
          if(person==null){
            detail="newbie"
            User.create({'name':username, win:0,lose:0})
            win=lose=0;
          }
          else{
            win=person.win;
            lose=person.lose;
          }
          console.log(`getstatus ${username} : %d win %d lose`, win, lose);
          const msg={
            username:username,
            win:win,
            lose:lose
          }
          io.emit('yourstatus',JSON.stringify(msg));
      })
  })
  socket.on('getranking',(data)=>{
    const receivedata = JSON.parse(data);
    const username = receivedata.username;
    isranking=true
    User.find({},(err,docs)=>{
      if(err)return handleError(err);
      const msg={
        username:username,
        stats:docs,
        length:docs.length
      }
      io.emit('yourranking',JSON.stringify(msg));
      console.log(`${docs.length} docs have been transferred`)
    })
  })

  socket.on('enter', (data) => {
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber
    myroomnumber = roomnumber
    myusername = username
    pname_bysid[socket.id]=username
    isranking=false
    if(isroomoccupied[roomnumber]==true){
      const msg1 = {
        username : username
      }
      isrefused=true
      io.emit('refuse',JSON.stringify(msg1))
      console.log(`refuse ${username}`)
      return;
    }
    isrefused=false;
    socket.join(`${roomnumber}`)
    console.log(`[Username : ${username}] entered [room number : ${roomnumber}]`)
    if(rcnt[roomnumber]==undefined||rcnt[roomnumber]==0){
        rcnt[roomnumber]=1;
        p1name[roomnumber]=username;
    }
    else{
        rcnt[roomnumber]++;
        p2name[roomnumber]=username;
    }
    if(rcnt[roomnumber]>1){
        console.log(`room full!`);
        isroomoccupied[roomnumber]=true;
        const msg = {
            username: p1name[roomnumber],
            content: p2name[roomnumber]
        }
        console.log(`${p1name[roomnumber]} vs ${p2name[roomnumber]}`);
        readycnt[roomnumber]=0;
        io.to(`${roomnumber}`).emit('roomfound',JSON.stringify(msg));
        
    }
  })

  socket.on('ready',(data)=>{
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber
    console.log(`[Username : ${username}] is ready! [room number : ${roomnumber}]`)
    if(readycnt[roomnumber]==undefined||readycnt[roomnumber]==0){
        readycnt[roomnumber]=1;
    }
    else{
        readycnt[roomnumber]++;
    }
    if(readycnt[roomnumber]>1){
        readycnt[roomnumber]=0;
        console.log(`all ready`);
        isroomover[roomnumber]=false;//시작
        const msg = {
            username: p1name[roomnumber],
            content: p2name[roomnumber],
            move : "m59"
        }
        console.log(`${p1name[roomnumber]} 's turn, ${p2name[roomnumber]} : wait`);
        io.to(`${roomnumber}`).emit('newturn',JSON.stringify(msg));
    }
  })

  socket.on('turnend',(data)=>{
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber
    const opponent=roomData.content
    const mymove = roomData.move
    console.log(`[Username : ${username}] 's turn end, ${opponent}'s turn start`)
    console.log(`move : ${mymove}`)
    const msg = {
      username: opponent,
      content: username,
      move : mymove
    }
    if((mymove[0]=='m')&&(mymove[2]=='1')){
      const endmsg={
        username:username,
        content:opponent
      }
      console.log(`${username} : win, ${opponent} : lose`)
      io.to(`${roomnumber}`).emit(`gameover`,JSON.stringify(endmsg));
      isroomover[myroomnumber]=true;
      handlegameover(username,opponent);
    }
    else io.to(`${roomnumber}`).emit('newturn',JSON.stringify(msg));
  })

  socket.on('waive',(data) => {
    console.log("!!!");
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber
    const opponent = roomData.content
    const det = roomData.detail
    socket.leave(`${roomnumber}`)
    console.log(`Username : ${username} left room ${roomnumber} , ${opponent} wins`)
    const endmsg={
      username:opponent,
      content:username,
      detail:det
    }
    isroomover[myroomnumber]=true;
    io.to(`${roomnumber}`).emit(`gameover`,JSON.stringify(endmsg));
    handlegameover(opponent,username);
  })

  socket.on('newMessage', (data) => {
    const messageData = JSON.parse(data)
    console.log(`[Room Number ${messageData.roomnumber}] ${messageData.username} : ${messageData.content}`)
    io.to(`${messageData.roomnumber}`).emit('update', JSON.stringify(messageData))
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected : ${socket.id}`)
    if(isrefused===true)return;
    if(isranking===true)return;
    socket.leave(`${myroomnumber}`)
    rcnt[myroomnumber]--;
    if(rcnt[myroomnumber]<=0){
        rcnt[myroomnumber]=0;
        isroomoccupied[myroomnumber]=false;
    }
    if(isroomover[myroomnumber])return;
    isroomover[myroomnumber]=true
    const endmsg={
      detail:'disconnect'
    }
    io.to(`${myroomnumber}`).emit(`gameover`,JSON.stringify(endmsg));
    let winner,loser
    if(pname_bysid[socket.id]==p1name[myroomnumber]){
      winner=p2name[myroomnumber]
      loser = p1name[myroomnumber]
    }
    else{
      winner=p1name[myroomnumber]
      loser = p2name[myroomnumber]
    }
    handlegameover(winner,loser);
    console.log(`unexpected disconnection : ${winner} wins, ${loser} loses`)
    // TODO
    console.log(`rcnt : ${rcnt[myroomnumber]}`);
    
  })
})

server.listen(80, () => {
  console.log(`Server listening at http://localhost:80`)
})

function handlegameover(winner,loser){
  User.findOneAndUpdate({"name":winner},{$inc:{"win":1}}).then(()=>
    User.findOne({"name":winner})
  )
  User.findOneAndUpdate({"name":loser},{$inc:{"lose":1}}).then(()=>
    User.findOne({"name":loser})
  )
}