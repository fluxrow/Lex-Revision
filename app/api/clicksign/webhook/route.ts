import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it's a Clicksign event
    const eventType = body?.event?.name;
    const document = body?.document;

    if (!eventType || !document) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    switch (eventType) {
      case 'auto_close':
        console.log(`Document signed and closed: ${document.key}`);
        // Handle fully signed document
        break;
      case 'sign':
        console.log(`Signer has signed the document: ${document.key}`);
        break;
      default:
        console.log(`Unhandled Clicksign event: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Clicksign Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}
