const mongoose = require("mongoose");
const PostSchema = new mongoose.Schema({
 user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "users"
 },
 text: {
  type: String
 },
 // Show user name and avatar 
 name: {
  type: String
 },
 avatar: {
  type: String
 },
 // Create array of likes:
 likes: [
  {
   // Determine which user is "liking" the post:
   // One like per user
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
   }
  }
 ],
 comments: [
  {
   user: {
    type: mongoose.Types.ObjectId,
    ref: "user"
   },
   text: {
    type: String,
    required: true
   },
   name: {
    type: String
   },
   avatar: {
    type: String
   },
   date: {
    type: Date,
    default: Date.now
   },
   updated: {
    type: Date,
    default: Date.now
   }
  }
 ],
 // Date of the Post it self
 date: {
  type: Date,
  default: Date.now
 }
});
module.exports = Post = mongoose.model("post", PostSchema);