const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch, query, where } = require('firebase/firestore');

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

// Function to batch delete expired stories
const cleanupExpiredStories = async () => {
  console.log('Running cleanup with batch delete...');

  try {
    // Create a batch for writing (deleting in this case)
    const batch = writeBatch(db);

    // Fetch all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('Fetching users...');

    // Loop through each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Checking stories for user: ${userId}`);

      // Fetch stories where expired = true for the current user
      const storiesSnapshot = await getDocs(
        query(collection(db, 'users', userId, 'stories'), where('expired', '==', true))
      );
      console.log(`Found ${storiesSnapshot.size} expired stories for user: ${userId}`);

      // Loop through each expired story and add it to the batch for deletion
      storiesSnapshot.forEach((storyDoc) => {
        const storyId = storyDoc.id;
        const storyRef = doc(db, 'users', userId, 'stories', storyId);
        batch.delete(storyRef); // Add delete operation to the batch
        console.log(`Adding expired story ${storyId} to batch for deletion.`);
      });
    }

    // Commit the batch (delete all expired stories in one operation)
    await batch.commit();
    console.log('Batch delete completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Route to manually trigger cleanup
expressApp.get('/cleanup', async (req, res) => {
  console.log('Manually triggering cleanup...');
  await cleanupExpiredStories();
  res.send('Cleanup process completed!');
});

// Start Express server
expressApp.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
