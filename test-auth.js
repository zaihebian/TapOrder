// Test script for authentication endpoints
// This script demonstrates how to test the auth endpoints

const testAuthEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing TapOrder Authentication Endpoints');
  console.log('==========================================');
  
  // Test 1: Health check
  console.log('\n1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Register endpoint
  console.log('\n2. Testing /auth/register endpoint...');
  try {
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: '+1234567890'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData);
    
    if (registerData.message) {
      console.log('✅ Registration successful');
    } else {
      console.log('❌ Registration failed:', registerData.error);
    }
  } catch (error) {
    console.log('❌ Register request failed:', error.message);
  }
  
  // Test 3: Login endpoint (this will fail without a valid verification code)
  console.log('\n3. Testing /auth/login endpoint...');
  try {
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: '+1234567890',
        verification_code: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      console.log('✅ Login successful');
      console.log('JWT Token:', loginData.token);
      console.log('\n4. JWT Token Verification:');
      console.log('Copy this token and paste it at https://jwt.io to verify:');
      console.log(loginData.token);
    } else {
      console.log('❌ Login failed:', loginData.error);
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
  }
};

// Run the tests
testAuthEndpoints();

