import * as crypto from 'crypto';

export class WebhookVerifier {
  /**
   * Verify Dialpad webhook signature (supports both HMAC and JWT)
   * @param payload Raw request body
   * @param signature Signature from X-Dialpad-Signature header
   * @param secret Webhook secret from Dialpad
   * @returns boolean indicating if signature is valid
   */
  static verifyDialpadSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Check if signature is JWT format (contains dots)
      if (signature.includes('.')) {
        return this.verifyJWTSignature(signature, secret);
      }
      
      // Otherwise, use HMAC-SHA256 (legacy format)
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Compare signatures (use constant-time comparison to prevent timing attacks)
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      // Ensure buffers have the same length before comparison
      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify JWT signature (HS256)
   * @param jwt JWT token from header
   * @param secret Secret key
   * @returns boolean indicating if signature is valid
   */
  private static verifyJWTSignature(jwt: string, secret: string): boolean {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [header, payload, signature] = parts;
      
      if (!signature) {
        return false;
      }
      
      // Create the signature part
      const data = `${header}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data, 'utf8')
        .digest('base64url');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'base64url'),
        Buffer.from(expectedSignature, 'base64url')
      );
    } catch (error) {
      console.error('Error verifying JWT signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature from header (supports different formats)
   * @param payload Raw request body
   * @param headerSignature Signature from header (e.g., "sha256=abc123...")
   * @param secret Webhook secret
   * @returns boolean indicating if signature is valid
   */
  static verifySignatureFromHeader(
    payload: string,
    headerSignature: string,
    secret: string
  ): boolean {
    try {
      // Handle different signature formats
      let signature: string;
      let algorithm = 'sha256';

      if (headerSignature.startsWith('sha256=')) {
        signature = headerSignature.substring(7);
        algorithm = 'sha256';
      } else if (headerSignature.startsWith('sha1=')) {
        signature = headerSignature.substring(5);
        algorithm = 'sha1';
      } else {
        // Assume raw signature
        signature = headerSignature;
      }

      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payload, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}
