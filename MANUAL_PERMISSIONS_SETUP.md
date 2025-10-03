# 🚀 Step-by-Step AWS ECR Permissions Setup

## 📋 What You Need to Do:

### Step 1: Open AWS Console
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Sign in with your account
3. Make sure you're in the correct region: **US East (N. Virginia)**

### Step 2: Navigate to IAM
1. In the AWS Console search bar, type "IAM"
2. Click on "IAM" service
3. In the left sidebar, click "Users"

### Step 3: Find Your User
1. Look for user: **comercross**
2. Click on the username

### Step 4: Add Permissions
1. Click the **"Add permissions"** button
2. Select **"Attach policies directly"**
3. Click **"Create policy"**

### Step 5: Create Policy
1. Click the **"JSON"** tab
2. Delete the existing content
3. Copy and paste this policy:

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
                "ecr:CompleteLayerUpload",
                "ecr:CreateRepository",
                "ecr:DescribeRepositories",
                "ecr:DeleteRepository",
                "ecr:SetRepositoryPolicy",
                "ecr:GetRepositoryPolicy"
            ],
            "Resource": "*"
        }
    ]
}
```

### Step 6: Save Policy
1. Click **"Next"**
2. Name: **ECRDeploymentPolicy**
3. Description: **Permissions for ECR deployment**
4. Click **"Create policy"**

### Step 7: Attach Policy to User
1. Go back to your user: **comercross**
2. Click **"Add permissions"**
3. Select **"Attach policies directly"**
4. Search for: **ECRDeploymentPolicy**
5. Check the box next to it
6. Click **"Next"**
7. Click **"Add permissions"**

## ✅ Test Your Setup

After completing the steps above, run this command to test:

```bash
aws ecr get-authorization-token
```

If it works, you'll see a JSON response with authorization data.

## 🚀 Deploy Your Webhook

Once permissions are working, deploy your webhook:

```bash
./deploy.sh
```

## 🆘 If You Need Help

If you encounter any issues:
1. Make sure you're logged in as the correct AWS account
2. Check that you're in the right region (us-east-1)
3. Wait 1-2 minutes after adding permissions for them to propagate
4. Try the test command again

## 📞 Quick Reference

- **AWS Account**: 194006482142
- **User**: comercross
- **Region**: us-east-1
- **Repository**: dialpad-webhook
