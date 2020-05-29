const mongoose = require("mongoose");

// message schema
const MessageSchema = mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
});

MessageSchema.statics.addMessage = (message, callback) => {
  message.save(callback);
};

MessageSchema.statics.getMessages = (callback) => {
  Message.find({}, callback);
};

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
