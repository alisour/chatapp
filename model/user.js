const mongoose = require("mongoose");

// user schema
const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
});

UserSchema.statics.getUserById = function (id, callback) {
  User.findById(id, callback);
};

UserSchema.statics.getUserByUsername = function (username, callback) {
  let query = { username: username };
  User.findOne(query, callback);
};

UserSchema.statics.getUsers = () => {
  return User.find({});
};

UserSchema.statics.addUser = function (newUser, callback) {
  User.getUserByUsername(newUser.username, (err, user) => {
    if (err) return callback({ msg: "There was an error on getting the user" });
    if (user) {
      let error = { msg: "Username is already in use" };
      return callback(error);
    } else {
      newUser.save(callback);
    }
  });
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
