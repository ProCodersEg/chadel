const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc } = require('firebase/firestore');

// Firebase configuration (replace with your actual Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyCs02APJC5xDrtrqu0LdoyIB8-EX8vAUrE",
  authDomain: "g-play-clone.firebaseapp.com",
  projectId: "g-play-clone",
  storageBucket: "g-play-clone.firebasestorage.app",
  messagingSenderId: "923114501349",
  appId: "1:923114501349:web:89c67d1657ea0f7d50100c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Express app
const expressApp = express();
const port = 8080 || process.env.PORT;

// Route to check if the service is running
expressApp.get('/', (req, res) => {
  res.send('Service is running!');
});

// Function to check and delete expired stories
const cleanupExpiredStories = async () => {
  console.log('Running cleanup...');

  try {
    // Fetch all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('Fetching users...');

    // Loop through each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Checking stories for user: ${userId}`);

      // Fetch stories for the current user
      const storiesSnapshot = await getDocs(collection(db, 'users', userId, 'stories'));
      console.log(`Found ${storiesSnapshot.size} stories for user: ${userId}`);

      // Loop through each story and check for expiration
      for (const storyDoc of storiesSnapshot.docs) {
        const storyData = storyDoc.data();
        const storyId = storyDoc.id;
        const storyEndDate = storyData.endDate;  // Assuming 'endDate' is stored as a long (milliseconds)
        
        const currentTime = Date.now();

        // Check if the story is expired
        if (storyEndDate <= currentTime) {
          console.log(`Story expired: ${storyId}`);
          await deleteDoc(doc(db, 'users', userId, 'stories', storyId));
          console.log(`Deleted expired story: ${storyId} for user: ${userId}`);
        }
      }
    }

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Route to manually trigger cleanup
expressApp.get('/cleanup', async (req, res) => {
  try {
    await cleanupExpiredStories();  // Run the cleanup function
    res.send('Cleanup completed successfully!');
  } catch (error) {
    res.status(500).send('Error during cleanup: ' + error.message);
  }
});

// Start Express server
expressApp.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
