// Test Firestore connection
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);

async function testFirestoreConnection() {
  console.log('🔥 Testing Firestore Connection...\n');
  
  try {
    console.log('1. Firestore initialized successfully');
    console.log('   Project ID:', firebaseConfig.projectId);
    
    // Test 2: Try to write a test document
    console.log('\n2. Testing document write...');
    const testData = {
      message: 'Hello Firestore!',
      timestamp: new Date(),
      testId: Math.random().toString(36).substring(7)
    };
    
    const docRef = await addDoc(collection(db, 'test'), testData);
    console.log('✅ Document written successfully');
    console.log('   Document ID:', docRef.id);
    
    // Test 3: Try to read documents
    console.log('\n3. Testing document read...');
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Documents read successfully');
    console.log('   Document count:', querySnapshot.size);
    
    if (querySnapshot.size > 0) {
      querySnapshot.forEach((doc) => {
        console.log('   Document:', doc.id, '=>', doc.data());
      });
    }
    
    console.log('\n🎉 Firestore is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Firestore error:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Solution: Enable Firestore in Firebase Console');
      console.log('   1. Go to https://console.firebase.google.com/project/motionlabsai-c2a0b');
      console.log('   2. Click "Firestore Database"');
      console.log('   3. Click "Create database"');
      console.log('   4. Choose "Start in test mode"');
    } else if (error.code === 'unavailable') {
      console.log('\n💡 Solution: Firestore API is not enabled');
      console.log('   1. Go to https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=motionlabsai-c2a0b');
      console.log('   2. Click "Enable API"');
    }
    
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting Firestore Connection Test\n');
  
  const success = await testFirestoreConnection();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Firestore is ready to use!');
    console.log('📝 You can now test the complete invitation system');
  } else {
    console.log('❌ Firestore needs to be enabled');
    console.log('📖 Follow the steps above to enable Firestore');
  }
}

runTest().catch(console.error);





