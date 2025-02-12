// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { subscriptionPlans, sandboxSubscriptionPlans } from '../_shared/subscription-plans.ts'
import { ErrorType, createErrorResponse } from '../_shared/errors.ts';

const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox';
const PAYPAL_CLIENT_ID = PAYPAL_MODE === 'sandbox' ? Deno.env.get('PAYPAL_SANDBOX_CLIENT_ID') || '' : Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_SECRET = PAYPAL_MODE === 'sandbox' ? Deno.env.get('PAYPAL_SANDBOX_SECRET') || '' : Deno.env.get('PAYPAL_SECRET') || '';
const PAYPAL_API_URL = PAYPAL_MODE === 'sandbox' ? Deno.env.get('PAYPAL_SANDBOX_API_URL') || 'https://api-m.sandbox.paypal.com' : Deno.env.get('PAYPAL_API_URL') || 'https://api-m.paypal.com'; // Use https://api-m.paypal.com for production


// Request validation schema
const paymentRequestSchema = z.object({
  planId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

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

async function createSubscriptionRecord(userId: string, subscriptionId: string, planId: string, supabaseAdmin: any) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .insert([
      {
        profile_id: userId,
        paypal_subscription_id: subscriptionId,
        plan_id: planId,
        status: 'pending_payment', // Will be updated to 'active' when PayPal webhook confirms payment
        pending_since: new Date().toISOString(), // Add timestamp for pending status
        last_payment_status: 'pending'
      }
    ]);

  if (error) throw error;
}

async function cancelSubscription(subscriptionId: string, supabaseAdmin: any) {
  const accessToken = await getPayPalAccessToken();

  // Cancel subscription with PayPal
  const cancelResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      reason: 'Customer requested cancellation'
    })
  });

  if (!cancelResponse.ok && cancelResponse.status !== 404) {
    throw new Error('Failed to cancel subscription with PayPal, error: ' + await cancelResponse.text());
  }

  // Update subscription status in database
  const { error: updateError } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('paypal_subscription_id', subscriptionId);

  if (updateError) {
    throw updateError;
  }
}

async function verifySubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to verify subscription with PayPal');
  }

  const data = await response.json();
  return data.status === 'ACTIVE';
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    if (req.method === 'DELETE') {
      const { subscriptionId } = await req.json();
      
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      // Get user from auth header
      const authHeader = req.headers.get('Authorization')?.split(' ')[1];
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
      if (authError || !user) {
        throw new Error('Invalid authorization');
      }

      // Verify subscription belongs to user
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('paypal_subscription_id')
        .eq('profile_id', user.id)
        .eq('paypal_subscription_id', subscriptionId)
        .single();

      if (subError || !subscriptions) {
        throw new Error('Subscription not found or unauthorized');
      }

      await cancelSubscription(subscriptionId, supabaseAdmin);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'GET') {
      // Get subscription ID from query parameters
      const url = new URL(req.url);
      const subscriptionId = url.searchParams.get('subscription_id');
      
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const isActive = await verifySubscription(subscriptionId);

      if (isActive) {
        // Update subscription status in database
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'active',
            last_payment_status: 'completed'
          })
          .eq('paypal_subscription_id', subscriptionId);

        console.log("Subscription is now active");

        if (updateError) {
          throw updateError;
        }
      }

      return new Response(JSON.stringify({ isActive }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get the authorization header and extract token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Get request data
    const requestData = await req.json();
    const { planId, successUrl, cancelUrl } = paymentRequestSchema.parse(requestData);

    return new Response(JSON.stringify({ success: false, error: 'Plans are temporarily unavailable, if you would like to extend your limits (free of charge) please contact me at mx.zahir2@gmail.com. Apologies for the inconvenience.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });

    // Get the subscription plan
    const plan = PAYPAL_MODE === 'sandbox' ? sandboxSubscriptionPlans.find(p => p.id === planId) : subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create subscription in PayPal
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.paypalPlanId,
        application_context: {
          return_url: successUrl,
          cancel_url: cancelUrl,
          brand_name: 'ColabAI',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          }
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to create PayPal subscription:', response);
      throw new Error('Failed to create PayPal subscription ' + response.statusText);
    }

    const subscriptionData = await response.json();

    // Create subscription record in database
    await createSubscriptionRecord(
      user.id,
      subscriptionData.id,
      planId,
      supabaseAdmin
    );

    // Verify subscription immediately
    const isActive = await verifySubscription(subscriptionData.id);

    if (isActive) {
      // Update subscription status in database
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'active',
          last_payment_status: 'completed'
        })
        .eq('paypal_subscription_id', subscriptionData.id);

      console.log("Subscription is now active");

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({
        approvalUrl: subscriptionData.links.find((link: any) => link.rel === 'approve').href,
        subscriptionId: subscriptionData.id,
        status: isActive ? 'active' : 'pending_activation'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing payment request:', error);
    return createErrorResponse(
      ErrorType.SERVER,
      'Error processing payment request',
      error.message
    );
  }
});
