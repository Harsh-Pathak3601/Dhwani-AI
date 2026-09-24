const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function runTests() {
  console.log('Starting API tests...');

  try {
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const email = `testuser${randomSuffix}@example.com`;
    const password = 'password123';
    
    // 1. Register
    console.log('\n--- Testing Auth Routes ---');
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email, password })
    });
    const registerData = await registerRes.json();
    console.log('Register Response:', registerRes.status, registerData);
    
    // 2. Login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData);
    
    const token = loginData.token;
    if (!token) throw new Error('No token received');
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // 3. Profile
    const profileRes = await fetch(`${API_URL}/auth/profile`, { headers: authHeaders });
    const profileData = await profileRes.json();
    console.log('Profile Response:', profileRes.status, profileData);
    
    // 4. Create Session
    console.log('\n--- Testing Session Routes ---');
    const sessionId = `sess_${randomSuffix}`;
    const callerNumber = `+1234567890${randomSuffix}`;
    const sessionRes = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ sessionId, callerNumber })
    });
    const sessionData = await sessionRes.json();
    console.log('Create Session Response:', sessionRes.status, sessionData);
    
    // 5. Get Session
    const getSessionRes = await fetch(`${API_URL}/sessions/${sessionId}`, { headers: authHeaders });
    const getSessionData = await getSessionRes.json();
    console.log('Get Session Response:', getSessionRes.status, getSessionData);
    
    // 6. Create Report
    console.log('\n--- Testing Report Routes ---');
    const reportRes = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        sessionId,
        callerNumber,
        summary: 'Test summary',
        scamType: 'Phishing',
        redFlags: ['Urgency', 'Requested money'],
        psychologicalTactics: ['Fear', 'Authority'],
        evidenceLog: [{ time: '00:05', event: 'Said he was IRS' }],
        recommendedAction: 'Hang up',
        formalComplaintText: 'Test formal complaint',
        peakRiskScore: 85
      })
    });
    const reportData = await reportRes.json();
    console.log('Create Report Response:', reportRes.status, reportData);
    
    // 7. Get Report
    const getReportRes = await fetch(`${API_URL}/reports/${sessionId}`, { headers: authHeaders });
    const getReportData = await getReportRes.json();
    console.log('Get Report Response:', getReportRes.status, getReportData);
    
    // 8. Create Community Report
    console.log('\n--- Testing Community Routes ---');
    const commRes = await fetch(`${API_URL}/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callerNumber, riskScore: 90 })
    });
    const commData = await commRes.json();
    console.log('Create Community Report:', commRes.status, commData);
    
    // 9. Check Community Report
    const checkCommRes = await fetch(`${API_URL}/community/check/${encodeURIComponent(callerNumber)}`);
    const checkCommData = await checkCommRes.json();
    console.log('Check Community Report:', checkCommRes.status, checkCommData);
    
    console.log('\nAll API tests completed successfully!');
  } catch (e) {
    console.error('Test script encountered an error:', e);
  }
}

runTests();
