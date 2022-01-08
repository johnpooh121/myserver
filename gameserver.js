const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)
const randomstring = require('randomstring')
let rcnt=[],p1name=[],p2name=[];

// 소켓 연결 코드
io.sockets.on('connection', (socket) => {
  console.log(`Socket connected : ${socket.id}`)

  socket.on('enter', (data) => {
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomnumber = roomData.roomnumber
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