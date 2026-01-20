/**
 * Test script to check if /api/users endpoint is working correctly
 */
const axios = require('axios');

async function testUsersAPI() {
    try {
        // First login to get token
        console.log('🔑 Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@foxivision.com',
            password: 'Admin@123', // Assuming this is the password
            userType: 'admin'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');

        // Now fetch users
        console.log('\n📥 Fetching users with limit=500...');
        const usersResponse = await axios.get('http://localhost:3001/api/users', {
            params: { filter: 'all', limit: 500 },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Users API Response:');
        console.log('   - Success:', usersResponse.data.success);
        console.log('   - Users count:', usersResponse.data.users?.length);

        if (usersResponse.data.users && usersResponse.data.users.length > 0) {
            console.log('   - First 5 users:');
            usersResponse.data.users.slice(0, 5).forEach((u, i) => {
                console.log(`     ${i + 1}. ${u.name} (${u.email}) - ${u.userType}`);
            });
        }

        // Also test stats API
        console.log('\n📊 Fetching stats...');
        const statsResponse = await axios.get('http://localhost:3001/api/users/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Stats:', statsResponse.data.stats);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testUsersAPI();
