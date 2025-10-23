import axios from 'axios';
import puppeteer from 'puppeteer';
import { authenticator } from 'otplib';

const APP_ID = '2800efd1';
const APP_SECRET = '52be26d5-0266-4ef8-9a85-2ff366bf8b8c';
const CLIENT_ID = '1100576856';
const TOTP_SECRET = 'V32DTAK3OZNXUD7OEVP6CQE5SOYOBEKD';
const MOBILE = '9110139026';
const PIN = '957232';

async function main() {
//   Step 1: Generate Consent
  const { data } = await axios.post(
    `https://auth.dhan.co/app/generate-consent?client_id=${CLIENT_ID}`,
    {},
    { headers: { app_id: APP_ID, app_secret: APP_SECRET } }
  );
  const consentAppId = data.consentAppId;
  console.log('✅ Consent App ID:', consentAppId);

  // Step 2: Automate browser login
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const url = `https://auth.dhan.co/login/consentApp-login?consentAppId=${consentAppId}`;
  await page.goto(url);

  // Enter mobile number
  await page.type('input[type="tel"]', MOBILE);
  await page.click('button[type="submit"]');

  // Enter TOTP
  const otp = authenticator.generate(TOTP_SECRET);

  console.log('✅ OTP:', otp);
  await page.waitForSelector('code-input input[type="tel"]');
  
  // Type each digit into separate input fields
  const otpInputs = await page.$$('code-input input[type="tel"]');
  for (let i = 0; i < otp.length && i < otpInputs.length; i++) {
    await otpInputs[i].type(otp[i]);
  }
  
  await page.click('button[type="submit"]');

  // Enter PIN
  await page.waitForSelector('code-input input[type="tel"]');
  
  // Type each digit into separate input fields
  const pinInputs = await page.$$('code-input input[type="tel"]');
  for (let i = 0; i < PIN.length && i < pinInputs.length; i++) {
    await pinInputs[i].type(PIN[i]);
  }
  
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  const finalUrl = page.url();
  console.log('✅ Redirected URL:', finalUrl);

  const tokenId = new URL(finalUrl).searchParams.get('tokenId');
  console.log('✅ Token ID:', tokenId);

  await browser.close();

  // Step 3: Consume Consent
  const { data: tokenData } = await axios.get(
    `https://auth.dhan.co/app/consumeApp-consent?tokenId=${tokenId}`,
    { headers: { app_id: APP_ID, app_secret: APP_SECRET } }
  );

  console.log('✅ Final Token Data:', tokenData);
}

main().catch(console.error);