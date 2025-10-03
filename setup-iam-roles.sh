#!/bin/bash

# Create IAM roles for ECS deployment
# Run this script before deploying to ECS

set -e

echo "🔐 Creating IAM roles for ECS deployment..."

# Create ECS Task Execution Role
echo "📝 Creating ECS Task Execution Role..."
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}' 2>/dev/null || echo "Role ecsTaskExecutionRole already exists"

# Attach ECS Task Execution Role Policy
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create ECS Task Role (for application permissions)
echo "📝 Creating ECS Task Role..."
aws iam create-role --role-name ecsTaskRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}' 2>/dev/null || echo "Role ecsTaskRole already exists"

echo "✅ IAM roles created successfully!"
echo ""
echo "📋 Roles created:"
echo "- ecsTaskExecutionRole (for ECS to pull images and write logs)"
echo "- ecsTaskRole (for application permissions)"
echo ""
echo "🚀 Now you can run: ./deploy-ecs.sh"
