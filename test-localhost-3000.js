// Test Firebase connection on localhost:3000
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBHYMPC7jL1mHzBzylCWi3dugH34dppMqw",
  authDomain: "motionlabsai-c2a0b.firebaseapp.com",
  projectId: "motionlabsai-c2a0b",
  storageBucket: "motionlabsai-c2a0b.firebasestorage.app",
  messagingSenderId: "630016859450",
  appId: "1:630016859450:web:df509d6f4412e1c7f00403",
  measurementId: "G-NJJXQ6PEJT",
  databaseURL: "https://motionlabsai-c2a0b-default-rtdb.firebaseio.com"
};

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection on localhost:3000...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized');
    console.log('   Project ID:', firebaseConfig.projectId);
    console.log('   Auth Domain:', firebaseConfig.authDomain);
    
    // Test 1: Try to create a test user
    console.log('\n👤 Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ User created successfully!');
      console.log('   User ID:', userCredential.user.uid);
      console.log('   Email:', userCredential.user.email);
      
      // Test 2: Try to write to Firestore
      console.log('\n📝 Testing Firestore write...');
      const docRef = await addDoc(collection(db, 'test-users'), {
        uid: userCredential.user.uid,
        email: testEmail,
        createdAt: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      });
      
      console.log('✅ Document written to Firestore!');
      console.log('   Document ID:', docRef.id);
      
      console.log('\n🎉 Firebase is working correctly on localhost:3000!');
      return true;
      
    } catch (authError) {
      console.error('❌ Authentication error:', authError.message);
      
      if (authError.code === 'auth/email-already-in-use') {
        console.log('💡 Email already exists, trying to sign in...');
        try {
          const signInResult = await signInWithEmailAndPassword(auth, testEmail, testPassword);
          console.log('✅ Sign in successful!');
          console.log('   User ID:', signInResult.user.uid);
          return true;
        } catch (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          return false;
        }
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Firebase error:', error.message);
    console.error('   Error code:', error.code);
    
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      console.log('\n💡 CORS Issue Detected!');
      console.log('   Solution: Add localhost:3000 to Firebase Authorized Domains');
      console.log('   1. Go to Firebase Console > Authentication > Settings');
      console.log('   2. Add "localhost:3000" to Authorized domains');
    }
    
    return false;
  }
}

testFirebaseConnection().catch(console.error);





