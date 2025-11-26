#!/usr/bin/env node

/**
 * Test script for POST /cells/:sheetId/:cellId endpoint
 * Run: node test-cell-save.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5001';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing POST /cells/:sheetId/:cellId endpoint\n');

  // Test 1: Valid sheet and cell
  console.log('Test 1: POST /cells/Sheet1/A1 with valid data');
  try {
    const result1 = await makeRequest('POST', '/cells/Sheet1/A1', { rawValue: 'test123' });
    console.log(`  Status: ${result1.status}`);
    console.log(`  Response: ${JSON.stringify(result1.data)}`);
    console.log(result1.status === 200 ? '  ✅ PASS\n' : '  ❌ FAIL\n');
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}\n`);
  }

  // Test 2: Null sheetId (should use default)
  console.log('Test 2: POST /cells/null/A2 with null sheetId');
  try {
    const result2 = await makeRequest('POST', '/cells/null/A2', { rawValue: 'test456' });
    console.log(`  Status: ${result2.status}`);
    console.log(`  Response: ${JSON.stringify(result2.data)}`);
    console.log(result2.status === 200 ? '  ✅ PASS\n' : '  ❌ FAIL\n');
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}\n`);
  }

  // Test 3: Undefined sheetId (should use default)
  console.log('Test 3: POST /cells/undefined/B1 with undefined sheetId');
  try {
    const result3 = await makeRequest('POST', '/cells/undefined/B1', { rawValue: 'test789' });
    console.log(`  Status: ${result3.status}`);
    console.log(`  Response: ${JSON.stringify(result3.data)}`);
    console.log(result3.status === 200 ? '  ✅ PASS\n' : '  ❌ FAIL\n');
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}\n`);
  }

  // Test 4: Missing rawValue (should still work with empty string)
  console.log('Test 4: POST /cells/Sheet1/C1 with missing rawValue');
  try {
    const result4 = await makeRequest('POST', '/cells/Sheet1/C1', {});
    console.log(`  Status: ${result4.status}`);
    console.log(`  Response: ${JSON.stringify(result4.data)}`);
    console.log(result4.status === 200 ? '  ✅ PASS\n' : '  ❌ FAIL\n');
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}\n`);
  }

  // Test 5: Formula value
  console.log('Test 5: POST /cells/Sheet1/D1 with formula');
  try {
    const result5 = await makeRequest('POST', '/cells/Sheet1/D1', { rawValue: '=SUM(A1:B1)' });
    console.log(`  Status: ${result5.status}`);
    console.log(`  Response: ${JSON.stringify(result5.data)}`);
    console.log(result5.status === 200 ? '  ✅ PASS\n' : '  ❌ FAIL\n');
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}\n`);
  }

  console.log('✅ All tests completed!');
}

runTests().catch(console.error);


