import { EmailClient } from '@azure/communication-email';

const connectionString = process.env.ACS_CONNECTION_STRING;
const senderAddress = process.env.ACS_SENDER_ADDRESS || 'DoNotReply@flightbuddy.com';
const appUrl = process.env.APP_URL || 'https://black-field-06d5ee20f.7.azurestaticapps.net';

export async function sendMatchNotification(
  requesterEmail: string,
  volunteerEmail: string,
  matchId: string,
): Promise<void> {
  if (!connectionString) return;
  const client = new EmailClient(connectionString);
  const matchUrl = `${appUrl}/matches/${matchId}`;
  await client.beginSend({
    senderAddress,
    recipients: {
      to: [
        { address: requesterEmail, displayName: 'Traveller' },
        { address: volunteerEmail, displayName: 'Volunteer' },
      ],
    },
    content: {
      subject: 'FlightBuddy – A Volunteer Match Has Been Found!',
      plainText: `A volunteer match was found. Visit ${matchUrl} to confirm.`,
      html: `<h2>Great news from FlightBuddy!</h2><p>A volunteer match has been found for your trip.</p><p><a href="${matchUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Match</a></p>`,
    },
  });
}

export async function sendMatchConfirmedNotification(
  requesterEmail: string,
  volunteerEmail: string,
  matchId: string,
): Promise<void> {
  if (!connectionString) return;
  const client = new EmailClient(connectionString);
  const matchUrl = `${appUrl}/matches/${matchId}`;
  await client.beginSend({
    senderAddress,
    recipients: { to: [{ address: requesterEmail }, { address: volunteerEmail }] },
    content: {
      subject: 'FlightBuddy – Match Confirmed! Contact Details Ready',
      plainText: `Your match is confirmed. See contact details at ${matchUrl}`,
      html: `<h2>Match Confirmed!</h2><p><a href="${matchUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Contact Details</a></p>`,
    },
  });
}
