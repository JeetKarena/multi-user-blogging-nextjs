// scripts/test-api.js
// Simple API test script - requires dev server to be running
// Run with: npm run test:api

import http from 'http';

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Blogging Platform API...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthCheck = await makeRequest('/api/trpc/auth.getProfile');
    if (healthCheck.status !== 401) {
      console.log('⚠️  Server responded but not with expected 401 for unauthenticated request');
    } else {
      console.log('✅ Server is running and responding');
    }

    // Test 2: Try to register a user
    console.log('2. Testing user registration...');
    const registerResponse = await makeRequest('/api/trpc/auth.register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Test User API',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        username: `testuser${Date.now()}`
      }
    });

    if (registerResponse.status === 200) {
      console.log('✅ User registration successful');
    } else {
      console.log(`⚠️  Registration returned status ${registerResponse.status}`);
      console.log('Response:', registerResponse.data);
    }

    console.log('\n🎉 API connectivity test completed!');
    console.log('\n📋 For full testing:');
    console.log('1. Import the Postman collection: postman_collection.json');
    console.log('2. Or use the OpenAPI spec: openapi.yaml');
    console.log('3. Make sure your database is seeded: npm run db:seed');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your dev server is running: npm run dev');
    console.log('2. Check that the server is accessible at http://localhost:3000');
    process.exit(1);
  }
}

// Run the test
testAPI();