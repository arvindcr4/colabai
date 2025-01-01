// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID') || '';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET') || '';
const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com'; // Use https://api-m.paypal.com for production

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function verifyWebhookSignature(webhookBody: string, headers: Headers): Promise<boolean> {
  const transmissionId = headers.get('PAYPAL-TRANSMISSION-ID');
  const timestamp = headers.get('PAYPAL-TRANSMISSION-TIME');
  const webhookId = PAYPAL_WEBHOOK_ID;
  const actualSignature = headers.get('PAYPAL-TRANSMISSION-SIG');
  const certUrl = headers.get('PAYPAL-CERT-URL');
  const authAlgo = headers.get('PAYPAL-AUTH-ALGO');

  if (!transmissionId || !timestamp || !webhookId || !actualSignature || !certUrl) {
    return false;
  }

  console.log("Headers:", headers);
  console.log("Webhook Body:", webhookBody);

  var response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken()}`
    },
    body: JSON.stringify({ "transmission_id": transmissionId, "transmission_time": timestamp, "cert_url": certUrl, "auth_algo": authAlgo, "transmission_sig": actualSignature, "webhook_id": webhookId, "webhook_event": webhookBody })
});

  if (!response.ok) {
    console.error('Failed to verify webhook signature response:', response);
    throw new Error('Failed to verify webhook signature');
  }

  const data = await response.json();

  console.log(`Webhook Signature Verification: ${data.verification_status}`);

  return data.verification_status === 'SUCCESS';
}

async function updateSubscriptionStatus(subscriptionId: string, status: string, supabaseAdmin: any) {
  console.log(`Updating subscription ${subscriptionId} to status: ${status}`);

  // Update subscription status in database
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('paypal_subscription_id', subscriptionId);

  if (subError) {
    console.error('Error updating subscription status:', subError);
    throw subError;
  }

  console.log(`Successfully updated subscription for ${subscriptionId}`);
}

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Clone the request so we can read the body multiple times
    const webhookBody = await req.json();

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(webhookBody, req.headers);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const event = webhookBody;
    const subscriptionId = event.resource.id;
    
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subscriptionId = event.resource.id;
      
      // Get the current subscription status
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('status, pending_since')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch subscription:', fetchError);
        throw fetchError;
      }

      // Only activate if:
      // 1. Status is pending_activation
      // 2. No cancellation timestamp exists
      // 3. Pending for less than 24 hours (safety check)
      const pendingSince = subscription?.pending_since ? new Date(subscription.pending_since) : null;
      const isRecentlyPending = pendingSince && 
        (new Date().getTime() - pendingSince.getTime() < 24 * 60 * 60 * 1000);

      if (subscription?.status === 'pending_activation' && 
          isRecentlyPending) {
        
        // Update subscription status
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'active',
            last_payment_status: 'completed'
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (updateError) {
          console.error('Failed to update subscription status:', updateError);
          throw updateError;
        }

        console.log('Subscription activated successfully');
      } else {
        console.log('Subscription not activated: Invalid state', {
          currentStatus: subscription?.status,
          pendingSince: subscription?.pending_since
        });
      }
    }

    if (event.event_type === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      const subscriptionId = event.resource.id;
      
      // Update subscription status
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'failed',
          last_payment_status: 'failed',
          failed_at: new Date().toISOString()
        })
        .eq('paypal_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Failed to update subscription status:', updateError);
        throw updateError;
      }
    }

    if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subscriptionId = event.resource.id;
      
      // Update subscription status
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          last_payment_status: 'cancelled'
        })
        .eq('paypal_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Failed to update subscription status:', updateError);
        throw updateError;
      }
    }

    if (event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      await updateSubscriptionStatus(subscriptionId, 'suspended', supabaseAdmin);
    }

    if (event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED') {
      await updateSubscriptionStatus(subscriptionId, 'expired', supabaseAdmin);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
