declare module '@emailjs/nodejs' {
  export interface SendOptions {
    publicKey?: string;
    privateKey?: string;
  }

  export interface EmailJSResponseStatus {
    status: number;
    text: string;
  }

  export function send(
    serviceID: string,
    templateID: string,
    templateParams?: Record<string, unknown>,
    options?: SendOptions
  ): Promise<EmailJSResponseStatus>;

  const emailjs: {
    send: typeof send;
  };

  export default emailjs;
}
