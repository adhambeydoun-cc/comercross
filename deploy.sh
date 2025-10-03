# AWS ECR Deployment Script

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration (use environment variables or defaults)
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
ECR_REPOSITORY_NAME=${AWS_ECR_REPOSITORY:-dialpad-webhook}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo "🔧 Deployment Configuration:"
echo "   AWS Region: $AWS_REGION"
echo "   ECR Repository: $ECR_REPOSITORY_NAME"
echo "   Image Tag: $IMAGE_TAG"

# Get AWS account ID
echo "🔍 Getting AWS account information..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "❌ Failed to get AWS account ID. Please check your AWS credentials."
    exit 1
fi

echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"

# ECR repository URI
ECR_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}

echo "Building Docker image..."
docker build -t ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} .

echo "Tagging image for ECR..."
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

echo "Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}

echo "Deployment complete!"
echo "Image URI: ${ECR_URI}:${IMAGE_TAG}"
