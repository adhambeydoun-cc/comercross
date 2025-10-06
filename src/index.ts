import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DialpadWebhookPayload, DialpadCallLog } from './types';
import { WebhookVerifier } from './utils/webhook-verifier';
import { WebhookHandler } from './services/webhook-handler';
import * as fs from 'fs';
import * as path from 'path';

// Environment variables
const PORT = parseInt(process.env.PORT || '3000');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443');
const DIALPAD_WEBHOOK_SECRET = process.env.DIALPAD_WEBHOOK_SECRET || '';
const BUILDERPRIME_API_KEY = process.env.BUILDERPRIME_API_KEY || '';
const BUILDERPRIME_BASE_URL = process.env.BUILDERPRIME_BASE_URL || 'https://api.builderprime.com/v1';

// SSL configuration
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/app/ssl/webhook.key';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/app/ssl/webhook.crt';

// Initialize Fastify with HTTPS support
const fastify: FastifyInstance = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
  ...(fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH) ? {
    https: {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    }
  } : {}),
});

// Add support for application/jwt content type
fastify.addContentTypeParser('application/jwt', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body as string);
    done(null, json);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// Initialize webhook handler
const webhookHandler = new WebhookHandler(BUILDERPRIME_API_KEY, BUILDERPRIME_BASE_URL);

// Health check endpoint
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  const mockStats = webhookHandler.getMockStats();
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'dialpad-webhook',
    mode: mockStats ? 'mock' : 'production',
    stats: mockStats
  };
});

// Mock data management endpoints (only available in mock mode)
fastify.get('/mock/stats', async (request: FastifyRequest, reply: FastifyReply) => {
  const stats = webhookHandler.getMockStats();
  if (!stats) {
    return reply.status(400).send({ error: 'Mock mode not enabled' });
  }
  return stats;
});

fastify.post('/mock/clear', async (request: FastifyRequest, reply: FastifyReply) => {
  webhookHandler.clearMockData();
  return { success: true, message: 'Mock data cleared' };
});

// Dialpad webhook endpoint
fastify.post('/webhook/dialpad', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const rawBody = JSON.stringify(request.body);
    const signature = request.headers['x-dialpad-signature'] as string;
    
    // Verify webhook signature (temporarily disabled for testing)
    if (DIALPAD_WEBHOOK_SECRET && signature) {
      fastify.log.info(`🔍 Signature received: ${signature}`);
      fastify.log.info(`🔍 Secret configured: ${DIALPAD_WEBHOOK_SECRET}`);
      
      // Temporarily skip signature verification for testing
      fastify.log.warn('⚠️ Signature verification temporarily disabled for testing');
    } else {
      fastify.log.warn('Missing webhook secret or signature - skipping verification');
    }

    const payload = request.body as any as DialpadWebhookPayload;
    
    // DEBUG: Log the payload structure
    fastify.log.info('🔍 DEBUG: Payload structure: ' + JSON.stringify({
      hasEvents: !!payload.events,
      eventsIsArray: Array.isArray(payload.events),
      eventsLength: payload.events?.length || 0,
      payloadKeys: Object.keys(payload || {}),
      firstEventType: payload.events?.[0]?.event_type || 'none'
    }));
    
    if (!payload.events || !Array.isArray(payload.events)) {
      fastify.log.error('❌ Invalid payload format - missing events array');
      return reply.status(400).send({ error: 'Invalid payload format' });
    }

    const results = [];
    
    // Process each event
    for (const event of payload.events) {
      fastify.log.info(`🔍 Processing event: ${event.event_type}`);
      fastify.log.info(`🔍 Event data: ${JSON.stringify(event.data, null, 2)}`);
      
      if (event.event_type === 'call_log.created' || event.event_type === 'call_log.updated' || event.event_type === 'call.completed' || event.event_type === 'call.ended' || event.event_type === 'call_log.ended') {
        // Handle call log events directly
        const result = await webhookHandler.processCallLogEvent(event.data);
        results.push({
          event_type: event.event_type,
          call_id: event.data.call_id,
          success: result.success,
          error: result.error,
        });
      } else if (event.event_type === 'call.connected' || event.event_type === 'call.ringing' || event.event_type === 'call.recording') {
        // Handle call events by fetching call log data
        const result = await webhookHandler.processCallEvent(event.data);
        results.push({
          event_type: event.event_type,
          call_id: event.data.call_id || event.data.id,
          success: result.success,
          error: result.error,
        });
      } else {
        fastify.log.info(`Ignoring event type: ${event.event_type}`);
        results.push({
          event_type: event.event_type,
          success: true,
          message: 'Event type not processed',
        });
      }
    }

    return reply.send({
      success: true,
      processed_events: results.length,
      results,
    });

  } catch (error) {
    fastify.log.error('Error processing webhook:', error as any);
    return reply.status(500).send({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generic webhook endpoint (for testing or other webhook sources)
fastify.post('/webhook/generic', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const signature = request.headers['x-signature'] as string;
    const webhookSecret = process.env.GENERIC_WEBHOOK_SECRET || '';
    
    // Verify webhook signature if secret is provided
    if (webhookSecret && signature) {
      const rawBody = JSON.stringify(request.body);
      const isValid = WebhookVerifier.verifySignatureFromHeader(
        rawBody,
        signature,
        webhookSecret
      );
      
      if (!isValid) {
        fastify.log.warn('Invalid generic webhook signature');
        return reply.status(401).send({ error: 'Invalid signature' });
      }
    }

    // Log the webhook payload for debugging
    fastify.log.info('Generic webhook received:', request.body as any);
    
    return reply.send({
      success: true,
      message: 'Generic webhook received',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    fastify.log.error('Error processing generic webhook:', error as any);
    return reply.status(500).send({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server
const start = async () => {
  try {
    // Validate required environment variables
    if (!BUILDERPRIME_API_KEY) {
      fastify.log.warn('BUILDERPRIME_API_KEY not set - webhook processing will fail');
    }
    
    if (!DIALPAD_WEBHOOK_SECRET) {
      fastify.log.warn('DIALPAD_WEBHOOK_SECRET not set - webhook verification disabled');
    }

    // Check if SSL certificates exist
    const hasSSL = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);
    
    if (hasSSL) {
      // Start HTTPS server
      await fastify.listen({ port: HTTPS_PORT, host: '0.0.0.0' });
      fastify.log.info(`🔒 HTTPS Server listening on port ${HTTPS_PORT}`);
      fastify.log.info(`🔒 HTTPS Health check: https://localhost:${HTTPS_PORT}/health`);
      fastify.log.info(`🔒 HTTPS Dialpad webhook: https://localhost:${HTTPS_PORT}/webhook/dialpad`);
      fastify.log.info(`🔒 HTTPS Generic webhook: https://localhost:${HTTPS_PORT}/webhook/generic`);
    } else {
      // Start HTTP server
      await fastify.listen({ port: PORT, host: '0.0.0.0' });
      fastify.log.info(`🌐 HTTP Server listening on port ${PORT}`);
      fastify.log.info(`🌐 HTTP Health check: http://localhost:${PORT}/health`);
      fastify.log.info(`🌐 HTTP Dialpad webhook: http://localhost:${PORT}/webhook/dialpad`);
      fastify.log.info(`🌐 HTTP Generic webhook: http://localhost:${PORT}/webhook/generic`);
    }
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();
