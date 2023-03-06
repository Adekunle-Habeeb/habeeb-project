
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const{userJoin, getCurrentUser, userLeave, getRoomUsers} = require("./utils/users");



const app = express();

const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));


const botName = "Admin ";
// Run when a user connects
io.on("connection", socket => {
  socket.on("joinRoom", ({username, room}) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);


  socket.emit("message",formatMessage(botName,  "Welcome to Chatcord!"));

  //broadcast when a user connects
  socket.broadcast
    .to(user.room)
    .emit(
      "message",
      formatMessage(botName, `${user.username} has joined the group chat`)
    );

      // send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
  });

//Runs when client disconnects

  //listen for chatMessage
  socket.on("chatMessage", msg => {

    const user = getCurrentUser(socket.id);
    io.emit("message", formatMessage(user.username, msg));
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit("message", formatMessage(botName,  `${user.username} has left the chat`));

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
  }
  });

});


server.listen(process.env.PORT || 80, function(){
  console.log("Server started running on port 80");
});
