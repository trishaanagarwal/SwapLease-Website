import LegalPage from '../components/LegalPage';

const sections = [
  {
    heading: 'Who we are',
    body: [
      'SwapLease ("we", "us", "our") operates an online platform that connects university students and other users to advertise and find residential lease transfers in Victoria, Australia. This Privacy Policy explains how we handle your personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).',
      'By using SwapLease, you consent to the collection, use, and disclosure of your personal information as described in this Policy.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'We collect personal information that you provide to us and that is generated through your use of the platform, including:',
      { list: [
        'Account information: your name, email address, password (stored securely and in encrypted form by our authentication provider), and optionally your university and phone number;',
        'Listing information: the property details, descriptions, photographs, prices, dates, and locations you choose to post;',
        'Messages: the content of messages you send to other users through the platform;',
        'Usage information: technical data such as your device, browser, and interactions with the platform, collected automatically; and',
        'Any other information you choose to provide when you contact us.',
      ] },
      'You do not have to provide your real details, but if you do not, we may be unable to provide some or all of the platform to you. Please do not include sensitive information (such as health, racial, or religious information) in your Listings or messages.',
    ],
  },
  {
    heading: 'How we collect it',
    body: [
      'We collect personal information directly from you when you register, create or edit a profile, post a Listing, or message another user. Some technical information is collected automatically through cookies and similar technologies used by our hosting and infrastructure providers.',
    ],
  },
  {
    heading: 'Why we use your information',
    body: [
      'We use your personal information to:',
      { list: [
        'create and manage your account and verify your email;',
        'display your Listings and profile to other users so the platform can function;',
        'enable you to communicate with other users;',
        'operate, maintain, secure, and improve the platform;',
        'detect and prevent fraud, abuse, and breaches of our Terms; and',
        'comply with our legal obligations.',
      ] },
      'Some information you provide is, by the nature of the service, visible to other users — for example, your name, university, and the details and photos in your Listings, and your name within conversations. Your email and phone number are not displayed publicly unless you choose to share them with another user.',
    ],
  },
  {
    heading: 'Who we share it with',
    body: [
      'We do not sell your personal information. We disclose it only as needed to operate the platform, including to:',
      { list: [
        'Google Firebase (Google LLC) — for authentication, database, and hosting of account and platform data;',
        'Cloudinary — for hosting and delivering the images you upload;',
        'other users — to the limited extent described above so the platform can work; and',
        'authorities or third parties where required or authorised by law, or to protect the rights, safety, or property of SwapLease or others.',
      ] },
    ],
  },
  {
    heading: 'Overseas storage',
    body: [
      'Our service providers (including Google and Cloudinary) may store and process data on servers located outside Australia, including in the United States and other countries. By using the platform, you acknowledge and consent to your personal information being stored and processed overseas. We take reasonable steps to use reputable providers that maintain appropriate security and privacy practices.',
    ],
  },
  {
    heading: 'Security',
    body: [
      'We take reasonable steps to protect your personal information from misuse, interference, loss, and unauthorised access, modification, or disclosure — including using reputable cloud providers, encrypted authentication, and database access rules. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security. You are responsible for keeping your password confidential.',
    ],
  },
  {
    heading: 'Accessing and correcting your information',
    body: [
      'You can view and update much of your information directly in your profile. You may also request access to, or correction of, the personal information we hold about you by contacting us. We will respond within a reasonable time, and may need to verify your identity first.',
    ],
  },
  {
    heading: 'Retention and deletion',
    body: [
      'We keep your personal information only for as long as needed to provide the platform and for legitimate legal, security, or operational purposes. You may request deletion of your account and associated personal information by contacting us; some information may be retained where required by law or to resolve disputes and enforce our agreements.',
    ],
  },
  {
    heading: 'Cookies',
    body: [
      'The platform and its providers use cookies and similar technologies to keep you signed in and to operate and improve the service. You can control cookies through your browser settings, but disabling them may affect how the platform works.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'SwapLease is intended for users aged 18 and over. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us with personal information, please contact us so we can remove it.',
    ],
  },
  {
    heading: 'Data breaches',
    body: [
      'If a data breach occurs that is likely to result in serious harm, we will assess and respond to it in accordance with the Notifiable Data Breaches scheme under the Privacy Act 1988 (Cth), including notifying affected individuals and the Office of the Australian Information Commissioner (OAIC) where required.',
    ],
  },
  {
    heading: 'Complaints',
    body: [
      'If you have a concern or complaint about how we have handled your personal information, please contact us first and we will try to resolve it. If you are not satisfied, you may contact the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.',
    ],
  },
  {
    heading: 'Changes to this Policy',
    body: [
      'We may update this Privacy Policy from time to time. Changes take effect when posted on the platform. Please review this page periodically to stay informed about how we handle your information.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="30 June 2026"
      intro="Your privacy matters to us. This Policy explains what personal information SwapLease collects, why we collect it, how we use and protect it, and the choices you have — in line with the Australian Privacy Principles."
      sections={sections}
    />
  );
}
