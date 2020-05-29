var path = require("path");
var bodyparser = require("body-parser");

const express = require("express");
app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
var connectMongo = require("./db/mongo");
var user = require("./model/user");
const Message = require("./model/message");
const port = 3000;

//middleware
app.use(bodyparser.json());

app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

app.use(express.static(__dirname + "/public"));

//connect to database
connectMongo();

var users = {};
var connection = {};
var numUsers = 0;

//socket functions
io.on("connection", function (socket) {
  var addedUser = false;

  socket.on("add user", function (username) {
    if (addedUser) return;

    socket.username = username;

    user.findOne({ username: socket.username }, function (err, doc) {
      if (err) {
        console.error(err);
      }
      if (doc == null) {
        user.create({ username: socket.username }, function (err, doc) {
          if (err) console.error(err);
          else {
            console.log("user added at database");
          }
        });
      } else {
        console.log("user already exists at database");
      }
    });

    addedUser = true;
    ++numUsers;

    connection[socket.username] = socket.id;
    users[socket.id] = socket.username;

    console.log("A user connected...");
    console.log("users: ", users);
    console.log("connections: ", connection);
    console.log("Num of users: ", numUsers);

    socket.emit("login");
    io.emit("clean list");
    io.emit("user list", connection);
  });

  //group message also can save to database
  socket.on("group message", function (sender, msg, receiver) {
    //              username             message              shout
    Message.create(
      { sender: sender, message: msg, receiver: receiver },
      function (err, doc) {
        if (err) {
          console.error(err);
        } else {
          console.log("A group message created...");
        }
      }
    );
    var mesg = msg.split(" ");

    console.log("sender:", sender);
    console.log("msg:", mesg[2]);

    io.emit("group", sender, msg);
  });

  //group message also can save to database
  socket.on("private message", function (sender, msg, receiver) {
    console.log("sender: ", sender);
    console.log("msg: ", msg);
    var another_msg = sender + " : " + msg;

    for (let i = 0; i < receiver.length; i++) {
      console.log("receiver[", i, "]: ", receiver[i]);

      //   username           message            receiver username
      Message.create(
        { sender: sender, message: msg, receiver: receiver[i] },
        function (err, doc) {
          if (err) {
            console.error(err);
          } else {
            console.log("A private message created...");
          }
        }
      );

      socket.to(connection[receiver[i]]).emit("private", another_msg);
    }
  });
  //message history
  socket.on("message history", function (sender) {
    //private and group history
    Message.find(function (err, doc) {
      if (err) {
        console.error(err);
      }
      for (const key of Object.keys(doc)) {
        var Receiver = JSON.stringify(doc[key].receiver);
        Receiver = Receiver.substr(1, Receiver.length - 2);

        if (Receiver == "shout") {
          //group
          var messageValue = JSON.stringify(doc[key].message);
          messageValue = messageValue.substr(1, messageValue.length - 2);

          var senderValue = JSON.stringify(doc[key].sender);
          senderValue = senderValue.substr(1, senderValue.length - 2);

          io.to(socket.id).emit("group history", messageValue);
        } else {
          //private
          var messageValue = JSON.stringify(doc[key].message);
          messageValue = messageValue.substr(1, messageValue.length - 2);

          var senderValue = JSON.stringify(doc[key].sender);
          senderValue = senderValue.substr(1, senderValue.length - 2);
          var value = senderValue + " : " + messageValue;

          if (users[socket.id] == senderValue || users[socket.id] == Receiver) {
            io.to(socket.id).emit("private history", value);
          }
        }
      }
      console.log("message history received...");
    });
  });

  //disconnect
  socket.on("disconnect", () => {
    if (addedUser) {
      --numUsers;

      delete users[socket.id];
      delete connection[socket.username];

      io.emit("clean list");
      io.emit("user list", connection);
      socket.emit("logout");

      console.log("users: ", users);
      console.log("connections: ", connection);
      console.log("A user left, num of users:", numUsers);
    }
  });
});

//get index.html
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

//server listen
server.listen(port, () => {
  console.log("Server listening at port %d", port);
});
