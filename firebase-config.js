// Firebase Configuration
// Replace these values with your actual Firebase project configuration
// You can find these values in your Firebase Console under Project Settings

const firebaseConfig = {
    apiKey: "AIzaSyCuxPMZ25a1RWg1eSf-rduS27KxWIFcwus",
    authDomain: "note-taking-app-13815.firebaseapp.com",
    projectId: "note-taking-app-13815",
    storageBucket: "note-taking-app-13815.firebasestorage.app",
    messagingSenderId: "514706753637",
    appId: "1:514706753637:web:a680bfab9f000870d15e8c"
};

console.log('Firebase config:', firebaseConfig);

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db;

console.log('Firebase services initialized:', { auth: !!auth, db: !!db });

// Example usage of Firestore query
const user = auth.currentUser;
if (user) {
    db.collection('notes').where('userId', '==', user.uid).get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                console.log(doc.id, " => ", doc.data());
            });
        })
        .catch(error => {
            console.error("Error getting documents: ", error);
        });
} 