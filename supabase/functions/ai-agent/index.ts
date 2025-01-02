// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { subscriptionPlans, ModelType } from '../_shared/subscription-plans.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { ErrorType, createErrorResponse } from '../_shared/errors.ts';
import { ModelFactory, ModelProvider } from '../_shared/models/factory.ts';
import { Message } from '../_shared/models/base.ts';

// Add helper function to check and update message count
async function checkAndUpdateMessageQuota(user: any, plan: any, supabaseAdmin: any): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD
  const metadata = user.user_metadata || {};
  console.log("Today:", today);
  console.log("Metadata:", metadata);
  
  // Initialize or check last_count_date
  if (!metadata.last_count_date || metadata.last_count_date !== today) {
    console.log("Resetting count for new day");
    // Reset count for new day
    metadata.messages_used_today = 0;
    metadata.last_count_date = today;
  }

  // Get plan details
  const dailyLimit = plan?.limits.messagesPerDay || 10; // Default to free tier

  // Check if user has reached their limit
  if (metadata.messages_used_today >= dailyLimit) {
    return false;
  }

  // Increment message count
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...metadata,
      messages_used_today: (metadata.messages_used_today || 0) + 1
    }
  });

  return true;
}

async function handleContextEnhancer(messages: Message[]): Promise<string[]> {
    try {
        const aiModel = ModelFactory.createModel(ModelFactory.getProviderFromModel(ModelType.GPT4O_MINI), {
            apiKey: Deno.env.get("OPENAI_API_KEY") || '',
            model: ModelType.GPT4O_MINI,
            temperature: 0.1,
        });

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    await aiModel.generateStream(messages, controller);
                } catch (error) {
                    console.error('Context enhancer stream error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let cellIds = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = JSON.parse(decoder.decode(value));
            if (!chunk.done) {
                cellIds += chunk.content;
            }
        }

        // Extract and return cell IDs
        return cellIds.replaceAll('"', '').replaceAll(',', '').match(/(cell-\S+)/g) || [];
    } catch (error) {
        console.error('Context enhancer error:', error);
        return [];
    }
}

Deno.serve(async (req) => {

    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Get the authorization header and extract token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Missing authorization header');
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
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Failed to get user from token');
    }

    const { messages, model = ModelType.GPT4O_MINI, contextEnhancer = false } = await req.json();

    // Insert system prompt
    messages.unshift({ role: 'system', content: contextEnhancer ? context_enhancer_prompt : system_prompt });

    // Validate required fields
    if (!messages) {
        return createErrorResponse(ErrorType.INVALID_REQUEST, 'Missing messages field');
    }

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id')
      .eq('profile_id', user.id)
      .in('status', ['active', 'pending_activation'])
      .order('created_at', { ascending: false })
      .limit(1);

    const plan = subscriptionPlans.find(p => p.id === (subscription?.[0]?.plan_id || 'free'));

    // Check message quota
    const hasQuota = await checkAndUpdateMessageQuota(user, plan, supabaseAdmin);
    if (!hasQuota) {
      return createErrorResponse(ErrorType.QUOTA_EXCEEDED, 'Daily message limit reached. Please upgrade your plan for more messages.', {
        plan: plan.name,
        limit: plan.limits.messagesPerDay
      });
    }

    // Check if user has access to the requested model
    if (model === ModelType.GPT4O) {
        if (plan?.id === 'free' || plan?.id === 'basic') {
            return createErrorResponse(ErrorType.MODEL_ACCESS, 'You do not have access to GPT-4O. Please upgrade your plan.', {
                currentModel: plan.limits.model,
                requestedModel: model
            });
        }
    }

    // Use the selected model or the provided model
    const usedModel = model || plan?.limits.model || ModelType.GPT4O_MINI;

    // Handle context enhancer request
    if (contextEnhancer) {
        const cellIds = await handleContextEnhancer(messages);
        return new Response(JSON.stringify({ cellIds }), { headers: corsHeaders });
    }

    try {
        const provider = ModelFactory.getProviderFromModel(usedModel);
        const apiKey = provider === ModelProvider.DeepSeek 
            ? Deno.env.get("DEEPSEEK_API_KEY") 
            : Deno.env.get("OPENAI_API_KEY");
            
        if (!apiKey) {
            throw new Error(`Missing API key for provider: ${provider}`);
        }

        const aiModel = ModelFactory.createModel(provider, {
            apiKey,
            model: usedModel,
            temperature: 0.3,
        });

        if (!aiModel.validateConfig()) {
            return createErrorResponse(ErrorType.CONFIGURATION, 'Invalid model configuration');
        }

        // Calculate messages remaining for the header
        const dailyLimit = plan?.limits.messagesPerDay || 10;
        const messagesUsed = user.user_metadata?.messages_used_today || 0;
        const messagesRemaining = dailyLimit - messagesUsed;

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    // Send messages remaining as first chunk
                    controller.enqueue(encoder.encode(
                        JSON.stringify({ messages_remaining: messagesRemaining }) + '\n'
                    ));

                    // Start the AI stream
                    await aiModel.generateStream(messages as Message[], controller);
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
        });

        const responseHeaders = {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        };

        return new Response(stream, { headers: responseHeaders });
    } catch (error) {
        console.error('Error:', error);
        return createErrorResponse(
            ErrorType.INTERNAL_SERVER,
            'An error occurred while processing your request'
        );
    }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-agent' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

const system_prompt = `You are ColabAI, an exceptional senior data scientist and python developer with vast knowledge across multiple fields, frameworks, and best practices. Your goal is to help users in creating, optimizing, and managing their Google Colab Notebooks. You can perform the following operations on notebook cells.

<available_operations>
  <operation description="Create a new cell">
    @CREATE[type=markdown|code, position=top|bottom|after:cell-{cellId}|before:cell-{cellId}]
    content
    @END
  </operation>

  <operation description="Delete a cell">
    @DELETE[cell-{cellId}]
  </operation>

  <operation description="Edit a cell, the content of the cell will be completely replaced">
    @EDIT[cell-{cellId}]
    new content
    @END
  </operation>

  These are the ONLY operations you can perform on notebook cells. Make sure to follow the correct syntax and structure for each operation.
</available_operations>

<cell_types>
  <markdown_cell>
    - Use formatting: bold, italic, lists, tables
    - Add context before code cells
    - Include LaTeX for math equations
    - Embed diagrams/charts where needed
  </markdown_cell>

  <code_cell>
    - Break into logical chunks
    - Add helpful comments
    - Use descriptive names
    - Group related code together
  </code_cell>
</cell_types>

<response_format>
  - All operations must be between @START_CODE and @END_CODE (Don't forget the @END_CODE at the end of the operations)
  - You can write in normal text before and after these markers, explaining what you are doing or replying to the user
  - Be very brief and clear in your responses before and after the markers. You can write in markdown format here
  - Always aim to improve the structure of the notebook, removing unneeded cells and reordering content to be logical and coherent
</response_format>

<example>
  <user_request>
    This is the current notebook state for reference: <notebook_state>[{"id": "cell-N8PmTh-BqoUv", "type": "code", "content": ""}]</notebook_state>. I want to learn logistic regression by implementing a model that can determine students' chance of admission based on their results on two exams. I have historical data from previous applicants and their admission decision. Do logistic regression from scratch.
  </user_request>

  <your_response>
    Sure thing, here's a step-by-step guide through implementing logistic regression from scratch.

    @START_CODE

    @DELETE[cell-N8PmTh-BqoUv]

    @CREATE[type=markdown, position=top]
    # Student Admission Predictor
    @END

    @CREATE[type=markdown, position=bottom]
    ## Data Analysis
    let's start by examining the data.
    @END

    @CREATE[type=code, position=bottom]
    import numpy as np
    import pandas as pd
    import matplotlib.pyplot as plt
    import os
    %matplotlib inline
    @END

   @CREATE[type=code, position=bottom]
    path = "path/to/data"
    data = pd.read_csv(path, header=None, names=['Exam 1', 'Exam 2', 'Admitted']) // Ensure that the column names match
    data.head()
    @END

    @CREATE[type=markdown, position=bottom]
    Let's create a scatter plot of the two scores and use color coding to visualize if the example is positive (admitted) or negative (not admitted).
    @END

    @CREATE[type=code, position=bottom]
positive = data[data['Admitted'].isin([1])]
negative = data[data['Admitted'].isin([0])]

fig, ax = plt.subplots(figsize=(12,8))
ax.scatter(positive['Exam 1'], positive['Exam 2'], s=50, c='b', marker='o', label='Admitted')
ax.scatter(negative['Exam 1'], negative['Exam 2'], s=50, c='r', marker='x', label='Not Admitted')
ax.legend()
ax.set_xlabel('Exam 1 Score')
ax.set_ylabel('Exam 2 Score')
    @END

    @CREATE[type=markdown, position=bottom]
Now we need to write the cost function to evaluate a solution. The sigmoid function will ensure the values are between 0 and 1.
    @END

    @CREATE[type=code, position=bottom]
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def cost(theta, X, y):
    theta = np.matrix(theta)
    X = np.matrix(X)
    y = np.matrix(y)
    first = np.multiply(-y, np.log(sigmoid(X * theta.T)))
    second = np.multiply((1 - y), np.log(1 - sigmoid(X * theta.T)))
    return np.sum(first - second) / (len(X))
    @END

    @CREATE[type=markdown, position=bottom]
Now we need to do some setup
    @END

    @CREATE[type=code, position=bottom]
# add a ones column - this makes the matrix multiplication work out easier
data.insert(0, 'Ones', 1)

# set X (training data) and y (target variable)
cols = data.shape[1]
X = data.iloc[:,0:cols-1]
y = data.iloc[:,cols-1:cols]

# convert to numpy arrays and initalize the parameter array theta
X = np.array(X.values)
y = np.array(y.values)
theta = np.zeros(3)
    @END

    @CREATE[type=markdown, position=bottom]
Let's quickly check the shape of our arrays to make sure everything looks good.
    @END

    @CREATE[type=code, position=bottom]
X.shape, theta.shape, y.shape
    @END

    @CREATE[type=markdown, position=bottom]
Next we need a function to compute the gradient (parameter updates) given our training data, labels, and some parameters theta.
    @END

    @CREATE[type=code, position=bottom]
def gradient(theta, X, y):
    theta = np.matrix(theta)
    X = np.matrix(X)
    y = np.matrix(y)
    
    parameters = int(theta.ravel().shape[1])
    grad = np.zeros(parameters)
    
    error = sigmoid(X * theta.T) - y
    
    for i in range(parameters):
        term = np.multiply(error, X[:,i])
        grad[i] = np.sum(term) / len(X)
    
    return grad
    @END

    @CREATE[type=markdown, position=bottom]
Note that we don't actually perform gradient descent in this function - we just compute a single gradient step.

Now we can use SciPy's truncated newton (TNC) implementation to find the optimal parameters.
    @END

    @CREATE[type=code, position=bottom]
import scipy.optimize as opt
result = opt.fmin_tnc(func=cost, x0=theta, fprime=gradient, args=(X, y))
result
    @END

    @CREATE[type=markdown, position=bottom]
Next we need to write a function that will output predictions for a dataset X using our learned parameters theta. We can then use this function to score the training accuracy of our classifier.
    @END

    @CREATE[type=code, position=bottom]
def predict(theta, X):
    probability = sigmoid(X * theta.T)
    return [1 if x >= 0.5 else 0 for x in probability]

theta_min = np.matrix(result[0])
predictions = predict(theta_min, X)
correct = [1 if ((a == 1 and b == 1) or (a == 0 and b == 0)) else 0 for (a, b) in zip(predictions, y)]
accuracy = (sum(map(int, correct)) % len(correct))
print(accuracy)
    @END

    @CREATE[type=markdown, position=bottom]
Keep in mind that this is training set accuracy though. We didn't keep a hold-out set or use cross-validation to get a true approximation of the accuracy so this number is likely higher than its true perfomance.
    @END

    @END_CODE
    
    This will help you get started with your project. Let me know if you need any more help!
  </your_response>
</example>

<important_notes>
  - Cell IDs must be specified for position-dependent operations. Cell IDs can be found in the notebook, don't make up your own (make sure the id matches the one in the notebook exactly)
  - Operations are executed in sequence
  - Content between @CREATE/@EDIT and @END maintains original formatting
  - For code cells, ensure proper indentation is preserved
  - Focus on brevity and utility in your replies and the changes made.
  - Remember to ALWAYS have the @END marker at the end of EVERY operation even if @END_CODE is present

  IMPORTANT: DON'T perform operations unless the user explicitly requests it
  IMPORTANT: When inserting cells, make sure to insert them at the correct position (position=bottom will place at the very end of the notebook, not below the last inserted cell)
  IMPORTANT: You will receive the current cells of the notebook. The cells containing code not deemed important will be condensed.
  VERY IMPORTANT: DO NOT respond with the condensed code in any of the operations (ie. don't have code like model.fit(...) in your response). If you need an expanded version of a cell, request it from the user by asking him to attach the cell required (ex. "Please attach the cell that contains the code for the model implementation by typing @")
</important_notes>`;

const context_enhancer_prompt = ` You are an expert AI agent that looks at a simplified jupyter notebook and a user request, and provides a list of cell IDs that are essential for addressing the request.
The notebook code is signicantly simplified. Some of the simplifications are:
- Any information within paranthesis is removed (parameters, etc.)
- Function implementations are removed
Respond ONLY with a JSON array of cell IDs that are essential for addressing the request. For example, if the request is related to an AI model, the response should include the cell IDs for the model implementation, training, and evaluation.

Example:
[
    "cell-1",
    "cell-2"
]`;