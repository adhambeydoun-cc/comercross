# Dialpad to BuilderPrime Webhook Integration

This service connects Dialpad call logs to your BuilderPrime CRM system via webhooks.

## Features

- ✅ Receives Dialpad webhook events for call logs
- ✅ Verifies webhook signatures for security
- ✅ Automatically creates or updates contacts in BuilderPrime
- ✅ Logs call data with recording URLs and metadata
- ✅ Dockerized for easy AWS ECR deployment
- ✅ Health check endpoint for monitoring
- ✅ Comprehensive error handling and logging

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

Required environment variables:
- `DIALPAD_WEBHOOK_SECRET`: Your Dialpad webhook secret
- `BUILDERPRIME_API_KEY`: Your BuilderPrime API key
- `BUILDERPRIME_BASE_URL`: BuilderPrime API base URL (optional)

### 2. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### 3. AWS ECR Deployment

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to ECR (requires AWS CLI configured)
./deploy.sh
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and timestamp.

### Dialpad Webhook
```
POST /webhook/dialpad
```
Receives Dialpad webhook events. Expects `X-Dialpad-Signature` header for verification.

### Generic Webhook (for testing)
```
POST /webhook/generic
```
Generic webhook endpoint for testing. Expects `X-Signature` header.

## Dialpad Webhook Configuration

In your Dialpad admin panel:

1. Go to **Settings** → **Integrations** → **Webhooks**
2. Add new webhook with URL: `https://your-domain.com/webhook/dialpad`
3. Select events: `call_log.created`, `call_log.updated`
4. Copy the webhook secret to your `.env` file

## BuilderPrime Integration

The service automatically:

1. **Finds existing contacts** by phone number
2. **Creates new contacts** if not found
3. **Logs call data** with:
   - Call direction (inbound/outbound)
   - Duration and status
   - Recording URLs (if available)
   - User and department information
   - Custom fields for Dialpad metadata

## Data Mapping

### Call Status Mapping
- `answered` → `answered`
- `missed` → `missed`
- `voicemail` → `voicemail`
- `busy` → `busy`
- `failed` → `failed`

### Custom Fields
- `dialpad_call_id`: Original Dialpad call ID
- `dialpad_user_id`: Dialpad user ID
- `dialpad_user_name`: Dialpad user name
- `dialpad_department_id`: Dialpad department ID
- `dialpad_department_name`: Dialpad department name

## Security

- Webhook signature verification using HMAC-SHA256
- Non-root Docker user for container security
- Environment variable validation
- Comprehensive error handling

## Monitoring

The service includes:
- Structured logging with Pino
- Health check endpoint
- Graceful shutdown handling
- Error tracking and reporting

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Check `DIALPAD_WEBHOOK_SECRET` is correct
   - Ensure Dialpad is sending the signature header

2. **BuilderPrime API errors**
   - Verify `BUILDERPRIME_API_KEY` is valid
   - Check API endpoint URL is correct
   - Review BuilderPrime API rate limits

3. **Contact creation fails**
   - Check BuilderPrime API permissions
   - Verify required fields are provided
   - Review API response for specific errors

### Logs

View logs in production:
```bash
# Docker logs
docker logs <container-id>

# AWS ECS logs (if using ECS)
aws logs tail /ecs/dialpad-webhook --follow
```

## Development

### Project Structure
```
src/
├── index.ts              # Main server file
├── types/                # TypeScript type definitions
│   ├── dialpad.ts        # Dialpad webhook types
│   ├── builderprime.ts   # BuilderPrime API types
│   └── index.ts          # Type exports
├── services/             # Business logic
│   ├── builderprime.ts   # BuilderPrime API client
│   └── webhook-handler.ts # Webhook processing logic
└── utils/                # Utility functions
    └── webhook-verifier.ts # Signature verification
```

### Adding New Features

1. **New webhook events**: Add handlers in `webhook-handler.ts`
2. **New CRM fields**: Update types in `types/builderprime.ts`
3. **New integrations**: Create new service files in `services/`

## License

ISC
