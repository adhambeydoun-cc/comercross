# 🚀 Render Deployment Guide

## **Step 1: Prepare Your Repository**

### Option A: Use GitHub (Recommended)
1. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Name it `dialpad-webhook`
   - Make it **public** (required for free Render plan)
   - Don't initialize with README (we already have files)

2. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dialpad-webhook.git
   git push -u origin main
   ```

### Option B: Use GitLab or Bitbucket
- Render supports GitLab and Bitbucket as well
- Follow similar steps but use your preferred Git hosting service

## **Step 2: Deploy to Render**

1. **Sign up for Render**:
   - Go to https://render.com
   - Sign up with your GitHub account (recommended)

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `dialpad-webhook` repository

3. **Configure the service**:
   - **Name**: `dialpad-webhook`
   - **Environment**: `Node`
   - **Plan**: `Starter` ($7/month)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: `18` (or latest)

4. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will override this)
   - `DIALPAD_WEBHOOK_SECRET`: `190283950172`
   - `BUILDERPRIME_API_KEY`: `CrylHk2.lQ8zZDbuDFtj94jniUpn`
   - `BUILDERPRIME_BASE_URL`: `https://dialpad-testing.builderprime.com/api`

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Wait for deployment to complete (usually 2-3 minutes)

## **Step 3: Get Your Webhook URL**

1. **Find your service URL**:
   - After deployment, you'll get a URL like: `https://dialpad-webhook-abc123.onrender.com`
   - This is your webhook endpoint

2. **Test the health endpoint**:
   - Visit: `https://your-app-url.onrender.com/health`
   - You should see: `{"status":"ok","timestamp":"...","mode":"production"}`

## **Step 4: Update Dialpad Webhook**

1. **Update Dialpad webhook URL**:
   - Go to your Dialpad webhook settings
   - Change URL to: `https://your-app-url.onrender.com/webhook/dialpad`
   - Keep the same secret: `190283950172`

2. **Test the integration**:
   - Make a test call
   - Check Render logs for webhook processing
   - Verify activity appears in BuilderPrime

## **Step 5: Monitor and Maintain**

### **Render Dashboard**
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, response times
- **Deployments**: Automatic deployments on git push

### **Health Monitoring**
- **Health Check**: `https://your-app-url.onrender.com/health`
- **Uptime**: Render provides built-in uptime monitoring
- **Alerts**: Email notifications for service issues

### **Automatic Deployments**
- **Auto-deploy**: Every git push to main branch
- **Zero-downtime**: Rolling deployments
- **Rollback**: Easy rollback to previous versions

## **Step 6: Production Considerations**

### **Scaling**
- **Starter Plan**: 1 instance, 512MB RAM
- **Professional Plan**: $25/month, auto-scaling
- **Enterprise Plan**: Custom pricing, dedicated resources

### **Custom Domain** (Optional)
- **Add custom domain**: `webhook.yourcompany.com`
- **SSL Certificate**: Automatically provided
- **DNS**: Point your domain to Render

### **Environment Management**
- **Production**: Use production BuilderPrime credentials
- **Staging**: Create separate Render service for testing
- **Secrets**: Use Render's secure environment variables

## **Step 7: Backup and Recovery**

### **Code Backup**
- **GitHub**: Your code is safely stored in GitHub
- **Multiple remotes**: Consider adding backup remotes

### **Configuration Backup**
- **Environment variables**: Document all settings
- **Webhook URLs**: Keep a record of all webhook configurations

## **Troubleshooting**

### **Common Issues**
1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Verify all required variables are set
3. **Webhook Failures**: Check Render logs for errors
4. **SSL Issues**: Render provides automatic SSL

### **Support**
- **Render Support**: Available in dashboard
- **Documentation**: https://render.com/docs
- **Community**: Render Discord/Forum

## **Cost Breakdown**

### **Starter Plan ($7/month)**
- ✅ 1 instance
- ✅ 512MB RAM
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Health checks
- ✅ Auto-deployments
- ✅ 99.9% uptime SLA

### **Professional Plan ($25/month)**
- ✅ Auto-scaling
- ✅ 1GB RAM
- ✅ Priority support
- ✅ 99.95% uptime SLA
- ✅ Advanced monitoring

## **Next Steps**

1. **Deploy to Render** using the steps above
2. **Test the webhook** with a real call
3. **Monitor performance** in Render dashboard
4. **Set up alerts** for any issues
5. **Consider upgrading** to Professional plan for production

---

**🎉 Congratulations!** Your webhook service will now be running on enterprise-grade infrastructure with 99.9% uptime guarantee!
