const express = require('express');
const firebase = require('firebase');
require('firebase/firestore');
const cron = require('node-cron');

// Initialize Firebase (replace with your Firebase config)
const firebaseConfig = {
   apiKey: "AIzaSyCs02APJC5xDrtrqu0LdoyIB8-EX8vAUrE",
  authDomain: "g-play-clone.firebaseapp.com",
  projectId: "g-play-clone",
  storageBucket: "g-play-clone.firebasestorage.app",
  messagingSenderId: "923114501349",
  appId: "1:923114501349:web:89c67d1657ea0f7d50100c"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Get Firestore reference
const db = firebase.firestore();

// Initialize Express app
const app = express();
const port = 8080;

// Function to check and delete expired stories
const cleanupExpiredStories = async () => {
  console.log('Running scheduled cleanup...');
  try {
    // Fetch all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log('Fetching users...');

    // Loop through each user
    usersSnapshot.forEach(async (userDoc) => {
      const userId = userDoc.id;
      console.log(`Checking stories for user: ${userId}`);

      // Fetch stories for the current user
      const storiesSnapshot = await db.collection('users').doc(userId).collection('stories').get();
      console.log(`Found ${storiesSnapshot.size} stories for user: ${userId}`);

      // Loop through each story and check for expiration
      storiesSnapshot.forEach(async (storyDoc) => {
        const storyData = storyDoc.data();
        const storyId = storyDoc.id;
        const storyEndDate = storyData.endDate.toMillis(); // Assuming 'endDate' is a Firestore timestamp
        
        const currentTime = Date.now();

        // Check if the story is expired
        if (storyEndDate <= currentTime) {
          console.log(`Story expired: ${storyId}`);
          await db.collection('users').doc(userId).collection('stories').doc(storyId).delete();
          console.log(`Deleted expired story: ${storyId} for user: ${userId}`);
        }
      });
    });

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Run the cleanup every 5 minutes (Cron job)
cron.schedule('*/5 * * * *', () => {
  cleanupExpiredStories();
});

// Set up Express routes
app.get('/', (req, res) => {
  res.send('Firebase Cleanup Service Running');
});

app.get('/cleanup', async (req, res) => {
  try {
    console.log('Manual cleanup triggered...');
    await cleanupExpiredStories();
    res.send('Cleanup completed successfully!');
  } catch (error) {
    res.status(500).send('Error during cleanup: ' + error.message);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
