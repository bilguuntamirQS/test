import app from './app.js'
import http from 'http'
import { Server } from 'socket.io'

const PORT = 3000

const server = http.createServer(app)
const io = new Server(server, {})

server.listen(PORT, () => {
  console.log('server started 3000 port')
})

const basket = io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('invoice', (paid) => {
    socket.emit('message', 'Connection Started')
  })
})

export const sendPaid = (paid) => {
  if(basket?.connected) {
    console.log('sending to')
    basket.emit('message', paid)
  }
}
