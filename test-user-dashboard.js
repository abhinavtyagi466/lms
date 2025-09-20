const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testUserDashboardAPIs() {
  console.log('🧪 Testing User Dashboard APIs...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Modules API
    console.log('\n2. Testing modules API...');
    try {
      const modulesResponse = await axios.get(`${API_BASE_URL}/modules`);
      console.log('✅ Modules API working:', modulesResponse.data.modules?.length || 0, 'modules found');
    } catch (error) {
      console.log('⚠️ Modules API error:', error.response?.data?.message || error.message);
    }

    // Test 3: Quizzes API
    console.log('\n3. Testing quizzes API...');
    try {
      const quizzesResponse = await axios.get(`${API_BASE_URL}/quizzes`);
      console.log('✅ Quizzes API working:', quizzesResponse.data.quizzes?.length || 0, 'quizzes found');
    } catch (error) {
      console.log('⚠️ Quizzes API error:', error.response?.data?.message || error.message);
    }

    // Test 4: User warnings API (will fail without auth)
    console.log('\n4. Testing user warnings API...');
    try {
      const warningsResponse = await axios.get(`${API_BASE_URL}/users/test-user-id/warnings`);
      console.log('✅ User warnings API working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ User warnings API requires auth (expected)');
      } else {
        console.log('⚠️ User warnings API error:', error.response?.data?.message || error.message);
      }
    }

    // Test 5: User certificates API (will fail without auth)
    console.log('\n5. Testing user certificates API...');
    try {
      const certificatesResponse = await axios.get(`${API_BASE_URL}/users/test-user-id/certificates`);
      console.log('✅ User certificates API working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ User certificates API requires auth (expected)');
      } else {
        console.log('⚠️ User certificates API error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 User Dashboard API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserDashboardAPIs();
