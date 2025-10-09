// Simple test script to test JWT generation without Twilio
const jwt = require('jsonwebtoken');

// Test JWT generation with your secret
const testJWT = () => {
  const secret = '8f3b6c21a9d94e7d8e5b7f12a3c44f9f';
  
  const payload = {
    userId: 'test-user-123',
    phone_number: '+12293049502'
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  
  console.log('Generated JWT Token:');
  console.log(token);
  console.log('\nCopy this token and verify at https://jwt.io');
  console.log('Use this secret for verification:', secret);
  
  // Verify the token
  try {
    const decoded = jwt.verify(token, secret);
    console.log('\nDecoded payload:');
    console.log(JSON.stringify(decoded, null, 2));
  } catch (error) {
    console.log('Token verification failed:', error.message);
  }
};

testJWT();

