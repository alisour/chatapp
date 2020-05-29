$(function () {
  var username;
  var socket = io();
  var connected = false;
  var Message = document.getElementById("message");
  var Chat = document.getElementById("chat");
  var userList = document.getElementById("userList");

  var username = "";
  var users = [];

  //prompt for username
  while (username.length < 1 || (username != null && username.length > 8)) {
    username = prompt(
      "Enter your username. (it's length has to be between 0 < x < 8 )"
    );

    while (!username.replace(/\s/g, "").length) {
      username = prompt(
        "Dont put empty string and online user in your username."
      );
    }
  }

  const setUserName = () => {
    if (username) {
      document.getElementById("name").innerText = username;

      socket.emit("add user", username);
    }
  };

  //set username
  setUserName();

  //get user list
  function addToList(user) {
    userList.innerHTML +=
      '<div class="chat_people">\
    <div class="chat_img"> <img src="./assets/generic-avatar.png" alt="sunil">\
    </div>\
    <div class="chat_ib">\
    <h4 style="color: #05728f;">' +
      user +
      "</h4>\
    </div>\
    </div>\
    <hr>";
  }

  //user list
  socket.on("user list", function (data) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (
          !users.some(function (v) {
            return key.indexOf(v) >= 0;
          })
        )
          users.push(key);

        addToList(key);
      }
    }
  });

  //group message
  socket.on("group", function (sender, msg) {
    var div = document.createElement("div");

    if (sender != username) {
      div.innerHTML =
        '<div class="incoming_msg">\
            <div class="received_msg">\
            <div class="received_withd_msg">\
              <p>(shout) ' +
        msg +
        "</p>\
            </div>\
            </div>\
            </div>\
            <br>";

      document.getElementById("chat").prepend(div);
    }
  });
  //private message
  socket.on("private", function (data) {
    var div = document.createElement("div");

    if (data.split(" ")[0] != username) {
      div.innerHTML =
        '<div class="incoming_msg">\
            <div class="received_msg">\
            <div class="received_withd_msg">\
              <p> (whisper) ' +
        data +
        "</p>\
            </div>\
            </div>\
            </div>\
            <br>";

      document.getElementById("chat").prepend(div);
    }
  });
  //all messages go through this
  group_message = function (message) {
    message = username + " : " + message;

    //split messages
    var data = message.split(" ");

    var sender = data[0];
    var receiver = [];
    var msg = [];
    var i;
    //check for '@' char
    for (i = 2; i < data.length; i++) {
      if (data[i].includes("@")) {
        receiver.push(data[i]);
      } else {
        msg.push(data[i]);
      }
    }

    if (!receiver.length) {
      //group message control
      socket.emit("group message", sender, message, "shout");

      div = document.createElement("div");
      div.innerHTML =
        '<div class="outgoing_msg">\
            <div class="sent_msg">\
            <p>' +
        message +
        "</p>\
            </div>\
            </div>";

      document.getElementById("chat").prepend(div);
    } else {
      //private message control
      for (i = 0; i < receiver.length; i++) {
        receiver[i] = receiver[i].substr(1, receiver[i].length);
      }

      msg = msg.join(" ");

      socket.emit("private message", sender, msg, receiver);

      div = document.createElement("div");
      div.innerHTML =
        '<div class="outgoing_msg">\
            <div class="sent_msg">\
            <p>' +
        message +
        "</p>\
            </div>\
            </div>";

      document.getElementById("chat").prepend(div);
    }
  };

  // Whenever the server emits 'login', log the login message
  socket.on("login", () => {
    connected = true;
  });

  // Whenever the server emits 'logout', log the login message
  socket.on("logout", () => {
    connected = false;
  });

  //group message history
  socket.on("group history", function (msg) {
    var div = document.createElement("div");

    var value = msg.split(" ");

    if (value[0] === username) {
      div.innerHTML =
        '<div class="outgoing_msg">\
            <div class="sent_msg">\
            <p>' +
        msg +
        "</p>\
            </div>\
            </div>";
    } else {
      div.innerHTML =
        '<div class="incoming_msg">\
        <div class="received_msg">\
        <div class="received_withd_msg">\
          <p>(shout) ' +
        msg +
        "</p>\
        </div>\
        </div>\
        </div>\
        <br>";
    }

    document.getElementById("chat").prepend(div);
  });

  //private message history
  socket.on("private history", function (data) {
    var div = document.createElement("div");

    var value = data.split(" ");

    console.log("split->", value[0]);

    if (value[0] === username) {
      div.innerHTML =
        '<div class="outgoing_msg">\
            <div class="sent_msg">\
            <p>' +
        data +
        "</p>\
            </div>\
            </div>";
    } else {
      div.innerHTML =
        '<div class="incoming_msg">\
                <div class="received_msg">\
                <div class="received_withd_msg">\
                  <p>(whisper) ' +
        data +
        "</p>\
                </div>\
                </div>\
                </div>\
                <br>";
    }

    document.getElementById("chat").prepend(div);
  });
  function loadMessage() {
    //msg history event
    socket.emit("message history", username);
  }
  //clean user list
  socket.on("clean list", function () {
    var list = document.getElementById("userList");

    users = [];

    list.innerHTML = "";
  });

  //enter keydown event--> message
  Message.addEventListener("keydown", function (event) {
    if (event.which === 13 && event.shiftKey == false) {
      group_message(Message.value);

      event.preventDefault();

      Message.value = "";
    }
  });

  window.addEventListener("load", loadMessage);
});
