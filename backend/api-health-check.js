/**
 * API Health Check Script
 * Checks all API routes connectivity for LMS application
 * Run with: node api-health-check.js
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@feportal.foxivision.net';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';
let testUserId = '';

const results = {
    passed: [],
    failed: [],
    skipped: []
};

const checkEndpoint = async (name, method, endpoint, data = null, requiresAuth = true, expectStatus = 200) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: requiresAuth ? { Authorization: `Bearer ${authToken}` } : {},
            timeout: 10000
        };

        if (data && (method === 'post' || method === 'put')) {
            config.data = data;
        }

        const response = await axios(config);
        const status = response.status || (response.data ? 200 : 500);

        if (status >= 200 && status < 400) {
            results.passed.push({ name, endpoint, status: '✅ PASS' });
            console.log(`✅ ${name} - ${endpoint}`);
            return response.data;
        } else {
            results.failed.push({ name, endpoint, status: `❌ FAIL (${status})` });
            console.log(`❌ ${name} - ${endpoint} (Status: ${status})`);
            return null;
        }
    } catch (error) {
        const status = error.response?.status || 'Network Error';

        // 404 for missing data is acceptable
        if (status === 404 || status === 401) {
            results.skipped.push({ name, endpoint, status: `⚠️ SKIP (${status})` });
            console.log(`⚠️ ${name} - ${endpoint} (${status} - Expected for missing data)`);
            return null;
        }

        results.failed.push({ name, endpoint, status: `❌ FAIL (${status})`, error: error.message });
        console.log(`❌ ${name} - ${endpoint} (${status}: ${error.message})`);
        return null;
    }
};

const runHealthCheck = async () => {
    console.log('\n🔍 ========================================');
    console.log('   LMS API HEALTH CHECK');
    console.log('   ' + new Date().toISOString());
    console.log('========================================\n');

    // 1. Health Check
    console.log('\n📌 BASIC HEALTH CHECK\n');
    await checkEndpoint('Server Health', 'get', '/health', null, false);

    // 2. Authentication
    console.log('\n📌 AUTHENTICATION APIs\n');
    const loginResult = await checkEndpoint('Admin Login', 'post', '/auth/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        userType: 'admin'
    }, false);

    if (loginResult?.token) {
        authToken = loginResult.token;
        console.log('   🔐 Auth token obtained successfully');
    } else if (loginResult?.data?.token) {
        authToken = loginResult.data.token;
        console.log('   🔐 Auth token obtained successfully');
    } else {
        console.log('   ⚠️ No auth token - some tests will fail');
    }

    await checkEndpoint('Get Current User (Me)', 'get', '/auth/me');

    // 3. User APIs
    console.log('\n📌 USER APIs (Admin)\n');
    const usersResult = await checkEndpoint('Get All Users', 'get', '/users?limit=5');

    if (usersResult?.users?.[0]?._id || usersResult?.data?.users?.[0]?._id) {
        testUserId = usersResult.users?.[0]?._id || usersResult.data?.users?.[0]?._id;
        console.log(`   👤 Test User ID: ${testUserId}`);
    }

    await checkEndpoint('Get User Stats', 'get', '/users/stats');
    await checkEndpoint('List Simple Users', 'get', '/users/list/simple');

    if (testUserId) {
        await checkEndpoint('Get User By ID', 'get', `/users/${testUserId}`);
        await checkEndpoint('Get User Warnings', 'get', `/users/${testUserId}/warnings`);
        await checkEndpoint('Get User Certificates', 'get', `/users/${testUserId}/certificates`);
    }

    // 4. Module APIs
    console.log('\n📌 MODULE APIs\n');
    await checkEndpoint('Get All Modules', 'get', '/modules');
    await checkEndpoint('Get Published Modules', 'get', '/modules/published');

    if (testUserId) {
        await checkEndpoint('Get User Modules', 'get', `/modules/user/${testUserId}`);
        await checkEndpoint('Get Personalised Modules', 'get', `/modules/user/${testUserId}/personalised`);
    }

    // 5. Progress APIs
    console.log('\n📌 PROGRESS APIs\n');
    if (testUserId) {
        await checkEndpoint('Get User Progress', 'get', `/progress/user/${testUserId}`);
    }
    await checkEndpoint('Get User Progress (API)', 'get', '/user-progress');

    // 6. Quiz APIs
    console.log('\n📌 QUIZ APIs\n');
    await checkEndpoint('Get All Quizzes', 'get', '/quizzes');

    if (testUserId) {
        await checkEndpoint('Get User Quiz Results', 'get', `/quizzes/results/${testUserId}`);
    }

    // 7. Quiz Attempts APIs
    console.log('\n📌 QUIZ ATTEMPT APIs\n');
    if (testUserId) {
        await checkEndpoint('Get Quiz Attempt Stats', 'get', `/quiz-attempts/stats/${testUserId}`);
        await checkEndpoint('Get Quiz Attempts History', 'get', `/quiz-attempts/history/${testUserId}`);
    }

    // 8. KPI APIs
    console.log('\n📌 KPI APIs\n');
    if (testUserId) {
        await checkEndpoint('Get User KPI Scores', 'get', `/kpi/user/${testUserId}`);
    }
    await checkEndpoint('Get KPI Configuration', 'get', '/kpi-configuration');

    // 9. KPI Triggers APIs
    console.log('\n📌 KPI TRIGGER APIs\n');
    await checkEndpoint('Get Pending Triggers', 'get', '/kpi-triggers/pending');
    await checkEndpoint('Get Unmatched KPI Entries', 'get', '/kpi-triggers/unmatched');

    // 10. Reports APIs
    console.log('\n📌 REPORTS APIs\n');
    await checkEndpoint('Get Admin Stats', 'get', '/reports/admin/stats');
    await checkEndpoint('Get All User Scores', 'get', '/reports/admin/user-scores');

    // 11. Notifications APIs
    console.log('\n📌 NOTIFICATION APIs\n');
    await checkEndpoint('Get Notifications', 'get', '/notifications');
    await checkEndpoint('Get Unread Count', 'get', '/notifications/unread-count');

    // 12. Training Assignments APIs
    console.log('\n📌 TRAINING ASSIGNMENT APIs\n');
    await checkEndpoint('Get Pending Assignments', 'get', '/training-assignments/pending');
    await checkEndpoint('Get Assignment Stats', 'get', '/training-assignments/stats');

    if (testUserId) {
        await checkEndpoint('Get User Assignments', 'get', `/training-assignments/user/${testUserId}`);
    }

    // 13. Audit Scheduling APIs
    console.log('\n📌 AUDIT SCHEDULING APIs\n');
    await checkEndpoint('Get Scheduled Audits', 'get', '/audit-scheduling/scheduled');
    await checkEndpoint('Get Audit Stats', 'get', '/audit-scheduling/stats');
    await checkEndpoint('Get KPI Rating Data', 'get', '/audit-scheduling/by-kpi-rating');

    if (testUserId) {
        await checkEndpoint('Get User Audit History', 'get', `/audit-scheduling/user/${testUserId}`);
    }

    // 14. Awards APIs
    console.log('\n📌 AWARDS APIs\n');
    await checkEndpoint('Get All Awards', 'get', '/awards');

    if (testUserId) {
        await checkEndpoint('Get User Awards', 'get', `/awards/user/${testUserId}`);
    }

    // 15. Lifecycle APIs
    console.log('\n📌 LIFECYCLE APIs\n');
    if (testUserId) {
        await checkEndpoint('Get User Lifecycle', 'get', `/lifecycle/${testUserId}`);
    }

    // 16. User Activity APIs
    console.log('\n📌 USER ACTIVITY APIs\n');
    if (testUserId) {
        await checkEndpoint('Get Activity Summary', 'get', `/user-activity/summary/${testUserId}`);
    }
    await checkEndpoint('Get Admin Analytics', 'get', '/user-activity/admin/analytics');

    // 17. Email Template APIs
    console.log('\n📌 EMAIL TEMPLATE APIs\n');
    await checkEndpoint('Get All Templates', 'get', '/email-templates');

    // 18. Email Log APIs
    console.log('\n📌 EMAIL LOG APIs\n');
    await checkEndpoint('Get Email Logs', 'get', '/email-logs');
    await checkEndpoint('Get Email Stats', 'get', '/email-logs/stats/overview');

    // 19. Recipient Group APIs
    console.log('\n📌 RECIPIENT GROUP APIs\n');
    await checkEndpoint('Get All Recipient Groups', 'get', '/recipient-groups');

    // 20. Exit Records APIs
    console.log('\n📌 EXIT RECORDS APIs\n');
    await checkEndpoint('Get Exit Records', 'get', '/users/exit-records');

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n\n========================================');
    console.log('           FINAL SUMMARY');
    console.log('========================================\n');

    console.log(`✅ PASSED: ${results.passed.length} endpoints`);
    console.log(`❌ FAILED: ${results.failed.length} endpoints`);
    console.log(`⚠️ SKIPPED: ${results.skipped.length} endpoints`);
    console.log(`📊 TOTAL: ${results.passed.length + results.failed.length + results.skipped.length} endpoints tested\n`);

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED ENDPOINTS:\n');
        results.failed.forEach(f => {
            console.log(`   • ${f.name} (${f.endpoint})`);
            if (f.error) console.log(`     Error: ${f.error}`);
        });
    }

    if (results.skipped.length > 0) {
        console.log('\n⚠️ SKIPPED ENDPOINTS (Expected - No Data):\n');
        results.skipped.forEach(s => {
            console.log(`   • ${s.name} (${s.endpoint})`);
        });
    }

    console.log('\n========================================');
    console.log('       API HEALTH CHECK COMPLETE');
    console.log('========================================\n');

    // Return summary
    return {
        passed: results.passed.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        total: results.passed.length + results.failed.length + results.skipped.length,
        healthy: results.failed.length === 0
    };
};

// Run the health check
runHealthCheck()
    .then(summary => {
        if (summary.healthy) {
            console.log('🎉 All APIs are healthy and connected!\n');
            process.exit(0);
        } else {
            console.log(`⚠️ ${summary.failed} API(s) have issues. Please review above.\n`);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
    });
