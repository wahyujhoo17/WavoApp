import crypto from 'crypto';

function calculateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function testWebhookDirectly() {
  const url = 'https://ai.cloudku.technology/triggers/webhook-debug/U7_8CHU4nFBsBfXyyLnWxe2U';
  const secret = 'wavo_wh_c6fe149042f349d7dae3f98b23fa18b8';
  const event = 'message.received';
  const payloadData = {
    from: '6283831211636',
    message: 'Halo, ini adalah pesan percobaan (test webhook) dari sistem Wavo ke URL baru!',
    timestamp: new Date().toISOString()
  };

  const payloadString = JSON.stringify({
    event,
    payload: payloadData,
    timestamp: new Date().toISOString()
  });

  const signature = calculateSignature(payloadString, secret);

  console.log('============================================');
  console.log('🚀 MENGIRIM WEBHOOK TEST');
  console.log('============================================');
  console.log(`URL Tujuan : ${url}`);
  console.log(`Event      : ${event}`);
  console.log(`Signature  : ${signature}`);
  console.log(`Payload    :`);
  console.log(JSON.stringify(JSON.parse(payloadString), null, 2));
  console.log('============================================');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wavo-Signature': signature,
        'X-Wavo-Event': event,
        'User-Agent': 'Wavo-Webhook-Dispatcher/3.0'
      },
      body: payloadString
    });
    
    console.log(`\n✅ HTTP Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`✅ Response  : ${text}`);
    console.log('============================================\n');
  } catch (err: any) {
    console.error(`\n❌ Gagal mengirim:`, err.message);
  }
}

testWebhookDirectly();
