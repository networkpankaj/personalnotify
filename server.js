const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const Leave = require('./models/leave');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/notificationApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get('/api/leave', async (req, res) => {
  try {
    const leaves = await Leave.find();
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leave', async (req, res) => {
  try {
    const { user, message, latitude, longitude, location } = req.body;
    const leave = new Leave({ user, message, latitude, longitude, location });
    await leave.save();
    io.emit('newLeaveRequest', leave); 
    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
