const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)
const randomstring = require('randomstring')

// 소켓 연결 코드
io.sockets.on('connection', (socket) => {
  console.log(`Socket connected : ${socket.id}`)

  socket.on('enter', (data) => {
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomNumber = roomData.roomNumber

    socket.join(`${roomNumber}`)
    console.log(`[Username : ${username}] entered [room number : ${roomNumber}]`)
    
    const enterData = {
      type : "ENTER",
      content : `${username} entered the room`  
    }
    io.to(`${roomNumber}`).emit('update', JSON.stringify(enterData))
  })

  socket.on('left', (data) => {
    const roomData = JSON.parse(data)
    const username = roomData.username
    const roomNumber = roomData.roomNumber

    socket.leave(`${roomNumber}`)
    console.log(`[Username : ${username}] left [room number : ${roomNumber}]`)

    const leftData = {
      type : "LEFT",
      content : `${username} left the room`  
    }
    io.to(`${roomNumber}`).emit('update', JSON.stringify(leftData))
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

server.listen(443, () => {
  console.log(`Server listening at http://localhost:80`)
})