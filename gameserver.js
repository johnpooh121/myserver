const express = require('express')
const { use } = require('express/lib/application')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)
const randomstring = require('randomstring')
let rcnt=[],p1name=[],p2name=[],readycnt=[];

// 소켓 연결 코드
io.sockets.on('connection', (socket) => {
  console.log(`Socket connected : ${socket.id}`)

  socket.on('enter', (data) => {
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber
    if(rcnt[roomnumber]!=undefined&&rcnt[roomnumber]==2)return;
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
        const msg = {
            username: p1name[roomnumber],
            content: p2name[roomnumber]
        }
        console.log(`${p1name[roomnumber]} vs ${p2name[roomnumber]}`);
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
    }
    else io.to(`${roomnumber}`).emit('newturn',JSON.stringify(msg));
  })

  socket.on('left', (data) => {
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber

    socket.leave(`${roomnumber}`)
    console.log(`[Username : ${username}] left [room number : ${roomnumber}]`)

    const leftData = {
      type : "LEFT",
      content : `${username} left the room`  
    }
    rcnt[roomnumber]--;
    readycnt[roomnumber]--;
    io.to(`${roomnumber}`).emit('update', JSON.stringify(leftData))
  })

  socket.on('newMessage', (data) => {
    const messageData = JSON.parse(data)
    console.log(`[Room Number ${messageData.roomnumber}] ${messageData.username} : ${messageData.content}`)
    io.to(`${messageData.roomnumber}`).emit('update', JSON.stringify(messageData))
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected : ${socket.id}`)
  })
})

server.listen(80, () => {
  console.log(`Server listening at http://localhost:80`)
})