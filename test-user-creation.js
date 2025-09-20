// Test script to verify user creation API
const axios = require('axios');

const testUserCreation = async () => {
  try {
    console.log('Testing user creation API...');
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
      phone: '1234567890',
      department: 'IT',
      manager: 'Test Manager'
    };

    console.log('Sending request with data:', testUser);
    
    const response = await axios.post('http://localhost:3001/api/users', testUser, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token-here' // You'll need to replace this with a valid token
      }
    });

    console.log('Response received:', response.data);
    console.log('User created successfully with Employee ID:', response.data.user.employeeId);
    
  } catch (error) {
    console.error('Error testing user creation:', error.response?.data || error.message);
  }
};

// Run the test
testUserCreation();