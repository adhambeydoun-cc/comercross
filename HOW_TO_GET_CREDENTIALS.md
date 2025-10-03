# How to Get Your Credentials
# ==========================

## 🏢 BuilderPrime API Credentials

### Step 1: Access BuilderPrime Admin Panel
1. Log into your BuilderPrime account
2. Navigate to **Settings** → **API** or **Integrations**
3. Look for **API Keys** or **Developer Settings**

### Step 2: Create API Key
1. Click **"Create New API Key"** or **"Generate API Key"**
2. Give it a descriptive name (e.g., "Dialpad Webhook Integration")
3. Set appropriate permissions (Contacts, Call Logs)
4. Copy the generated API key

### Step 3: Note Base URL
- Default: `https://api.builderprime.com/v1`
- Custom domain: Check your BuilderPrime settings for custom API endpoint

---

## 📞 Dialpad Webhook Credentials

### Step 1: Access Dialpad Admin Panel
1. Log into Dialpad as an administrator
2. Go to **Settings** → **Integrations** → **Webhooks**

### Step 2: Create Webhook
1. Click **"Add Webhook"** or **"Create Webhook"**
2. Set **Webhook URL**: `https://your-domain.com/webhook/dialpad`
3. Select **Events**: 
   - `call_log.created`
   - `call_log.updated`
4. Copy the **Webhook Secret** (this is your credential)

### Step 3: Test Webhook
1. Save the webhook configuration
2. Dialpad will send a test event
3. Check your webhook logs to verify it's working

---

## ☁️ AWS Credentials

### Step 1: Create IAM User
1. Log into AWS Console
2. Go to **IAM** → **Users** → **Create User**
3. Username: `dialpad-webhook-deploy`
4. Select **"Programmatic access"**

### Step 2: Set Permissions
Create a custom policy with these permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "*"
        }
    ]
}
```

### Step 3: Get Credentials
1. After creating the user, go to **Security Credentials**
2. Click **"Create Access Key"**
3. Copy the **Access Key ID** and **Secret Access Key**

### Step 4: Configure AWS CLI
```bash
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key  
# Enter your region (e.g., us-east-1)
# Enter output format (json)
```

---

## 🔒 Security Best Practices

### Environment Variables
- Never commit credentials to git
- Use `.env` files for local development
- Use AWS Secrets Manager for production

### AWS IAM
- Use least privilege principle
- Rotate credentials regularly
- Use IAM roles when possible

### Webhook Security
- Always verify webhook signatures
- Use HTTPS endpoints
- Implement rate limiting

---

## 🧪 Testing Your Credentials

### Test BuilderPrime API
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.builderprime.com/v1/contacts
```

### Test AWS Credentials
```bash
aws sts get-caller-identity
```

### Test Dialpad Webhook
- Use the test webhook endpoint in Dialpad
- Check your server logs for incoming events
