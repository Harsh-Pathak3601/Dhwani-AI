import dotenv from 'dotenv';
dotenv.config();

function createWavBuffer(sampleRate = 16000, durationSeconds = 2, freq = 440) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write sine wave samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.sin(2 * Math.PI * freq * t) * 0.5; // 50% volume
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

async function runVelmaTests() {
  console.log('==================================================');
  console.log('   MODULATE.AI VELMA-2 INTEGRATION TEST');
  console.log('==================================================\n');

  // Test 1: Check Status
  console.log('▶ [Test 1] Checking /api/modulate/status...');
  const t0 = Date.now();
  const statusRes = await fetch('http://127.0.0.1:3001/api/modulate/status');
  const statusJson = await statusRes.json();
  console.log(`✓ Status check (${Date.now() - t0}ms):`, statusJson);

  // Test 2: Batch Analysis Test
  console.log('\n▶ [Test 2] Generating 2-second audio sample & testing Velma-2 Batch API...');
  const wav = createWavBuffer(16000, 2, 440);
  const base64Audio = wav.toString('base64');

  const t1 = Date.now();
  const batchRes = await fetch('http://127.0.0.1:3001/api/modulate/analyze-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64Audio,
      filename: 'synthetic_tone_test.wav',
      mimeType: 'audio/wav'
    })
  });

  const batchLatency = Date.now() - t1;
  const batchJson = await batchRes.json();

  console.log(`✓ Batch API Result (${batchLatency}ms):`);
  console.log(JSON.stringify(batchJson, null, 2));

  // Test 3: Streaming WebSocket connection test
  console.log('\n▶ [Test 3] Testing Velma-2 Streaming WebSocket handshake...');
  const apiKey = process.env.MODULATE_API_KEY;
  if (!apiKey) {
    console.log('❌ MODULATE_API_KEY missing in .env');
    return;
  }

  const wsUrl = `wss://platform.modulate.ai/api/velma-2-synthetic-voice-detection-streaming?api_key=${encodeURIComponent(apiKey)}&sample_rate=16000&num_channels=1&audio_format=s16le`;
  
  const wsStart = Date.now();
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('⚠️ Streaming test timed out waiting for response (10s)');
      ws.close();
      resolve(null);
    }, 10000);

    ws.onopen = () => {
      console.log(`✓ WebSocket connected to Modulate Velma Streaming in ${Date.now() - wsStart}ms!`);
      // Send raw PCM samples (without WAV header)
      const rawPcm = wav.subarray(44);
      ws.send(rawPcm);
      console.log(`✓ Pushed ${rawPcm.length} bytes of audio frames into Velma stream...`);
      ws.send(''); // Signal end of stream to flush remaining frames
    };

    ws.onmessage = (event) => {
      console.log('✓ Modulate Stream Message Received:', event.data);
      clearTimeout(timeout);
      ws.send(''); // End of stream
      ws.close();
      resolve(null);
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
      clearTimeout(timeout);
      resolve(null);
    };
  });

  console.log('\n==================================================');
  console.log('   VELMA-2 TESTS COMPLETED');
  console.log('==================================================');
}

runVelmaTests().catch(console.error);
