const { WebhookHandler } = require('./dist/services/webhook-handler');
const { WebhookVerifier } = require('./dist/utils/webhook-verifier');

// Initialize webhook handler
const webhookHandler = new WebhookHandler(
  process.env.BUILDERPRIME_API_KEY,
  process.env.BUILDERPRIME_BASE_URL
);

exports.handler = async (event, context) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Extract webhook data
    const payload = JSON.parse(event.body);
    const signature = event.headers['X-Dialpad-Signature'] || event.headers['x-dialpad-signature'];
    
    // Verify webhook signature
    if (signature && process.env.DIALPAD_WEBHOOK_SECRET) {
      const isValid = WebhookVerifier.verifyDialpadSignature(
        event.body,
        signature,
        process.env.DIALPAD_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        console.log('Invalid webhook signature');
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    }
    
    // Process webhook events
    const results = [];
    for (const webhookEvent of payload.events) {
      if (webhookEvent.event_type === 'call_log.created' || 
          webhookEvent.event_type === 'call_log.updated' ||
          webhookEvent.event_type === 'call.completed' ||
          webhookEvent.event_type === 'call.ended' ||
          webhookEvent.event_type === 'call_log.ended') {
        
        const result = await webhookHandler.processCallLogEvent(webhookEvent.data);
        results.push({
          event_type: webhookEvent.event_type,
          call_id: webhookEvent.data.call_id,
          success: result.success,
          error: result.error,
        });
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Dialpad-Signature'
      },
      body: JSON.stringify({ 
        success: true, 
        processed: results.length,
        results: results 
      })
    };
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
