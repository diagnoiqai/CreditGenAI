import { ISMSProvider } from './ISMSProvider';
import { MockSMSProvider } from './providers/MockSMSProvider';

/**
 * Singleton Factory for resolving the configured SMS Provider
 */
export class SMSServiceFactory {
  private static instance: ISMSProvider;

  /**
   * Returns the SMS provider based on the SMS_PROVIDER environment variable.
   * Always returns MockSMSProvider for now as per user request.
   */
  public static getSMSProvider(): ISMSProvider {
    if (this.instance) return this.instance;

    console.log(`[SMS Factory] Initializing SMS Provider: mock`);

    this.instance = new MockSMSProvider();

    return this.instance;
  }
}
