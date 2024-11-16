// Import the necessary Firebase services from the modular SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc } = require('firebase/firestore');
const cron = require('node-cron');

// Firebase Configuration (Replace with your Firebase configuration)
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

// Initialize Firestore
const db = getFirestore(app);

// Function to clean up expired stories
async function cleanupExpiredStories() {
  const now = Date.now(); // Get the current timestamp in milliseconds
  console.log('Starting cleanup process at:', new Date(now));

  try {
    // Get all users from Firestore
    console.log('Fetching users...');
    const usersCollection = await getDocs(collection(db, 'users'));

    // Loop through each user
    for (const userDoc of usersCollection.docs) {
      const userId = userDoc.id;
      console.log(`Checking stories for user: ${userId}`);

      const storiesCollectionRef = collection(db, 'users', userId, 'stories');

      // Get all stories for this user
      const storiesSnapshot = await getDocs(storiesCollectionRef);
      console.log(`Found ${storiesSnapshot.size} stories for user: ${userId}`);

      // Loop through each story and check if it is expired
      for (const storyDoc of storiesSnapshot.docs) {
        const storyData = storyDoc.data();

        // Check if the story has an 'endDate' and if it's expired
        if (storyData.endDate && storyData.endDate <= now) {
          console.log(`Story expired: ${storyDoc.id}`);
          
          // Delete the expired story
          await deleteDoc(doc(db, 'users', userId, 'stories', storyDoc.id));
          console.log(`Deleted expired story: ${storyDoc.id} for user: ${userId}`);
        }
      }
    }

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}


// Schedule the cleanup task to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Running scheduled cleanup...');
  cleanupExpiredStories();
});
