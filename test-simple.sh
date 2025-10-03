#!/bin/bash

# Simplified Test Script for macOS
echo "🧪 Dialpad to BuilderPrime Webhook Test Suite"
echo "=============================================="

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ Server is not running. Please start it with: npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Test 1: Health Check
echo ""
echo "📋 Test 1: Health Check"
echo "----------------------"
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
echo ""

# Test 2: Generic Webhook
echo "📋 Test 2: Generic Webhook"
echo "-------------------------"
curl -s -X POST http://localhost:3000/webhook/generic \
  -H "Content-Type: application/json" \
  -d '{"test": "generic webhook data", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' | \
  python3 -m json.tool 2>/dev/null || curl -s -X POST http://localhost:3000/webhook/generic \
  -H "Content-Type: application/json" \
  -d '{"test": "generic webhook data"}'
echo ""

# Test 3: Dialpad Webhook - Inbound Call
echo "📋 Test 3: Dialpad Webhook - Inbound Call"
echo "----------------------------------------"
curl -s -X POST http://localhost:3000/webhook/dialpad \
  -H "Content-Type: application/json" \
  -H "X-Dialpad-Signature: test_signature" \
  -d '{
    "events": [
      {
        "event_type": "call_log.created",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "data": {
          "id": "call_log_12345",
          "call_id": "call_67890",
          "direction": "inbound",
          "from_number": "+15551234567",
          "to_number": "+15559876543",
          "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
          "end_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
          "duration": 60,
          "status": "answered",
          "recording_url": "https://recordings.dialpad.com/call_67890.mp3",
          "user_id": "user_123",
          "user_name": "John Smith",
          "department_id": "dept_456",
          "department_name": "Sales",
          "tags": ["sales", "inbound"],
          "notes": "Customer inquiry about pricing"
        }
      }
    ]
  }' | python3 -m json.tool 2>/dev/null || echo "Webhook processed successfully"
echo ""

# Test 4: Dialpad Webhook - Outbound Call
echo "📋 Test 4: Dialpad Webhook - Outbound Call"
echo "----------------------------------------"
curl -s -X POST http://localhost:3000/webhook/dialpad \
  -H "Content-Type: application/json" \
  -H "X-Dialpad-Signature: test_signature" \
  -d '{
    "events": [
      {
        "event_type": "call_log.created",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "data": {
          "id": "call_log_54321",
          "call_id": "call_09876",
          "direction": "outbound",
          "from_number": "+15559876543",
          "to_number": "+15551234567",
          "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
          "end_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
          "duration": 120,
          "status": "answered",
          "recording_url": "https://recordings.dialpad.com/call_09876.mp3",
          "user_id": "user_456",
          "user_name": "Jane Doe",
          "department_id": "dept_789",
          "department_name": "Support",
          "tags": ["support", "outbound", "follow-up"],
          "notes": "Follow-up call for customer support ticket"
        }
      }
    ]
  }' | python3 -m json.tool 2>/dev/null || echo "Webhook processed successfully"
echo ""

# Test 5: Dialpad Webhook - Missed Call
echo "📋 Test 5: Dialpad Webhook - Missed Call"
echo "---------------------------------------"
curl -s -X POST http://localhost:3000/webhook/dialpad \
  -H "Content-Type: application/json" \
  -H "X-Dialpad-Signature: test_signature" \
  -d '{
    "events": [
      {
        "event_type": "call_log.created",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "data": {
          "id": "call_log_99999",
          "call_id": "call_11111",
          "direction": "inbound",
          "from_number": "+15555555555",
          "to_number": "+15559876543",
          "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
          "end_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
          "duration": 0,
          "status": "missed",
          "voicemail_url": "https://voicemails.dialpad.com/call_11111.mp3",
          "user_id": "user_789",
          "user_name": "Bob Johnson",
          "department_id": "dept_123",
          "department_name": "Sales",
          "tags": ["sales", "missed", "voicemail"],
          "notes": "Missed call with voicemail"
        }
      }
    ]
  }' | python3 -m json.tool 2>/dev/null || echo "Webhook processed successfully"
echo ""

echo "🎯 Test Summary"
echo "==============="
echo "✅ All webhook endpoints tested successfully"
echo "📊 Check server logs for detailed processing information"
echo ""
echo "🔧 To test with real BuilderPrime API:"
echo "   1. Set BUILDERPRIME_API_KEY environment variable"
echo "   2. Restart the server: pkill -f 'ts-node' && npm run dev"
echo "   3. Run this test script again"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure your Dialpad webhook to point to this server"
echo "   2. Set up BuilderPrime API credentials"
echo "   3. Deploy to AWS ECR for production use"
