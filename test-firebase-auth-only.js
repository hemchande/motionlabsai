// Test Firebase Authentication only (without Firestore)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBHYMPC7jL1mHzBzylCWi3dugH34dppMqw",
  authDomain: "motionlabsai-c2a0b.firebaseapp.com",
  projectId: "motionlabsai-c2a0b",
  storageBucket: "motionlabsai-c2a0b.firebasestorage.app",
  messagingSenderId: "630016859450",
  appId: "1:630016859450:web:df509d6f4412e1c7f00403",
  measurementId: "G-NJJXQ6PEJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testFirebaseAuth() {
  console.log('🔥 Testing Firebase Authentication...\n');
  
  try {
    // Test 1: Check if Firebase is initialized
    console.log('1. Firebase initialized successfully');
    console.log('   Project ID:', firebaseConfig.projectId);
    console.log('   Auth Domain:', firebaseConfig.authDomain);
    
    // Test 2: Try to create a test user
    console.log('\n2. Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ User created successfully');
      console.log('   User ID:', userCredential.user.uid);
      console.log('   Email:', userCredential.user.email);
      console.log('   Email Verified:', userCredential.user.emailVerified);
      
      // Test 3: Sign out
      console.log('\n3. Testing sign out...');
      await signOut(auth);
      console.log('✅ Sign out successful');
      
      // Test 4: Sign in with created user
      console.log('\n4. Testing sign in...');
      const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Sign in successful');
      console.log('   User ID:', signInCredential.user.uid);
      console.log('   Email:', signInCredential.user.email);
      
      // Clean up - sign out again
      await signOut(auth);
      console.log('\n✅ Firebase Authentication is working correctly!');
      
      return true;
      
    } catch (authError) {
      console.error('❌ Authentication error:', authError.message);
      
      if (authError.code === 'auth/email-already-in-use') {
        console.log('   (This is expected if the test user already exists)');
        return true;
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return false;
  }
}

async function testWebApp() {
  console.log('\n🌐 Testing Web App Authentication...\n');
  
  try {
    // Test the web app's authentication endpoint
    const response = await fetch('http://localhost:3001/api/invite-athlete', {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Web app is running');
      console.log('   Response:', data.message);
    } else {
      console.log('❌ Web app connection failed');
    }
    
  } catch (error) {
    console.error('❌ Web app test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Firebase Authentication Tests\n');
  
  const authSuccess = await testFirebaseAuth();
  await testWebApp();
  
  console.log('\n' + '='.repeat(50));
  if (authSuccess) {
    console.log('🎉 Firebase Authentication is working!');
    console.log('📝 Next steps:');
    console.log('   1. Enable Firestore in Firebase Console');
    console.log('   2. Set up Firestore security rules');
    console.log('   3. Test the complete authentication flow');
  } else {
    console.log('❌ Firebase Authentication needs setup');
    console.log('📝 Check Firebase Console:');
    console.log('   1. Enable Authentication');
    console.log('   2. Enable Email/Password sign-in method');
    console.log('   3. Enable Firestore Database');
  }
}

runTests().catch(console.error);









