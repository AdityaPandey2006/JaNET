// create_mass_posts.js
// Usage (PowerShell):
//   $env:MONGO_URI="mongodb://localhost:27017/JaNET"; $env:POSTS_PER_USER="8"; node create_mass_posts.js
// Usage (bash):
//   MONGO_URI="mongodb://localhost:27017/JaNET" POSTS_PER_USER=8 node create_mass_posts.js

const mongoose = require('mongoose');
const path = require('path');

// adjust these paths if your models are located elsewhere
const User = require(path.resolve(__dirname, './models/User'));
const Post = require(path.resolve(__dirname, './models/Post'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/JaNET';
const POSTS_PER_USER = parseInt(process.env.POSTS_PER_USER || '5', 10);
const MAX_RANDOM_LIKES = parseInt(process.env.MAX_RANDOM_LIKES || '15', 10); // 0 .. MAX_RANDOM_LIKES

function randomFrom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

// Fisher-Yates shuffle on a shallow copy (doesn't mutate the original)
function shuffledCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sampleTitles = [
  "Thoughts on distributed systems",
  "My ML experiment notes",
  "How I fixed a deployment bug",
  "Weekend project update",
  "Quick tip for performance"
];

const sampleBodies = [
  "Today I explored a new optimization and the results were surprising.",
  "Here's a short writeup on what I tried and the lessons learned.",
  "I encountered a tricky bug with async code — here's how I debugged it.",
  "Sharing some resources and a short code snippet that helped me.",
  "Working on a small POC; posting progress and next steps."
];

(async function main(){
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', MONGO_URI);

    const users = await User.find({}, { _id: 1, username: 1, name: 1 }).lean();
    if(!users || users.length === 0){
      console.log('No users found. Exiting.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`Found ${users.length} users. Creating up to ${POSTS_PER_USER} posts per user...`);

    const createdPosts = [];

    for (const user of users) {
      for (let i = 0; i < POSTS_PER_USER; ++i) {
        const title = `${randomFrom(sampleTitles)} — ${user.username} #${i + 1}`;
        const description = `${randomFrom(sampleBodies)} (${new Date().toISOString()})`;

        // pick a random number of likes (0 .. MAX_RANDOM_LIKES)
        const likeCount = Math.floor(Math.random() * (MAX_RANDOM_LIKES + 1));

        // choose random users who liked the post without mutating `users`
        const shuffled = shuffledCopy(users);
        // remove the author from potential likers so author doesn't like own post (for realism)
        const filtered = shuffled.filter(u => String(u._id) !== String(user._id));
        const likedByUsers = filtered.slice(0, Math.min(likeCount, filtered.length)).map(u => u._id);

        const newPost = new Post({
          title,
          description,
          likes: likedByUsers.length, // keep likes consistent with likedBy
          likedBy: likedByUsers,
          author: user._id
        });

        const saved = await newPost.save();

        // push to user's Posts array — adjust if your schema stores differently
        await User.updateOne(
          { _id: user._id },
          { $push: { Posts: { postId: saved._id } } }
        );

        createdPosts.push({
          user: user.username,
          postId: String(saved._id),
          likes: likedByUsers.length
        });

        process.stdout.write('.');
      }
      process.stdout.write('\n');
    }

    console.log(`\nCreated ${createdPosts.length} posts for ${users.length} users.`);
    console.log('Sample created posts (first 10):', createdPosts.slice(0, 10));
    await mongoose.disconnect();
    console.log('Done. Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating posts:', err);
    try { await mongoose.disconnect(); } catch(_) {}
    process.exit(1);
  }
})();