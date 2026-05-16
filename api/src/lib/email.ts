import { EmailClient } from '@azure/communication-email';
import { DefaultAzureCredential } from '@azure/identity';

const endpoint = process.env.ACS_ENDPOINT!;
const senderAddress = process.env.ACS_SENDER_ADDRESS || 'DoNotReply@flightbuddy.com';

export async function sendMatchNotification(
  requesterEmail: string,
  volunteerEmail: string,
  matchId: string,
): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = new EmailClient(endpoint, credential);

  const dashboardUrl = process.env.APP_URL || 'https://flightbuddy.azurestaticapps.net';
  const matchUrl = `${dashboardUrl}/matches/${matchId}`;

  const message = {
    senderAddress,
    recipients: {
      to: [
        { address: requesterEmail, displayName: 'Traveller' },
        { address: volunteerEmail, displayName: 'Volunteer' },
      ],
    },
    content: {
      subject: 'FlightBuddy - A Volunteer Match Has Been Found!',
      plainText: `Great news! A volunteer match has been found for your FlightBuddy trip.\n\nVisit ${matchUrl} to confirm the match and exchange contact details.\n\nSafe travels!`,
      html: `<h2>Great news from FlightBuddy!</h2><p>A volunteer match has been found for your trip.</p><p><a href="${matchUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:18px;">View Match and Confirm</a></p><p>Contact details will be shared once both parties confirm.</p>`,
    },
  };

  await client.beginSend(message);
}

export async function sendMatchConfirmedNotification(
  requesterEmail: string,
  volunteerEmail: string,
  matchId: string,
): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = new EmailClient(endpoint, credential);

  const dashboardUrl = process.env.APP_URL || 'https://flightbuddy.azurestaticapps.net';
  const matchUrl = `${dashboardUrl}/matches/${matchId}`;

  const message = {
    senderAddress,
    recipients: {
      to: [
        { address: requesterEmail },
        { address: volunteerEmail },
      ],
    },
    content: {
      subject: 'FlightBuddy - Match Confirmed! Contact Details Ready',
      plainText: `Your match has been confirmed! Visit ${matchUrl} to see each other contact details.`,
      html: `<h2>Match Confirmed!</h2><p>Both parties have confirmed. You can now see each other contact details.</p><p><a href="${matchUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:18px;">View Contact Details</a></p>`,
    },
  };

  await client.beginSend(message);
}
