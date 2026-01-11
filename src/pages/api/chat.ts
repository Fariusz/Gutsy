import type { APIRoute } from 'astro';
import { z } from 'zod';
import { OpenRouterService } from '../../lib/services/openrouter-service.js';
import { ChatRequestSchema } from '../../lib/validation/schemas.js';

export const prerender = false;

// Endpoint-specific schema for API validation
const ChatEndpointSchema = ChatRequestSchema.extend({
  // Additional endpoint-specific validations can go here
});

/**
 * POST /api/chat - Send chat completion request to OpenRouter
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate input using Zod schema
    const validationResult = ChatEndpointSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get OpenRouter API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({
          error: 'OpenRouter service is not configured',
          code: 'SERVICE_UNAVAILABLE'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create OpenRouter service instance
    const openRouterService = new OpenRouterService(apiKey);

    // Send chat request
    const chatResponse = await openRouterService.chat(validationResult.data);

    return new Response(
      JSON.stringify(chatResponse),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Chat API error:', error);

    // Handle OpenRouter service errors specifically
    if (error && typeof error === 'object' && 'name' in error && error.name === 'OpenRouterServiceError') {
      const serviceError = error as any;
      
      const statusCode = (() => {
        switch (serviceError.code) {
          case 'AUTHENTICATION_ERROR':
          case 'AUTHORIZATION_ERROR':
            return 401;
          case 'VALIDATION_ERROR':
          case 'MODEL_NOT_FOUND':
            return 400;
          case 'RATE_LIMIT_ERROR':
            return 429;
          case 'SERVER_ERROR':
            return 503;
          default:
            return 500;
        }
      })();

      return new Response(
        JSON.stringify({
          error: serviceError.message,
          code: serviceError.code,
          retryable: serviceError.retryable
        }),
        { 
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * GET /api/chat - Get available models (optional endpoint)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get OpenRouter API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenRouter service is not configured',
          code: 'SERVICE_UNAVAILABLE'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create OpenRouter service instance
    const openRouterService = new OpenRouterService(apiKey);

    // Get available models
    const models = await openRouterService.getAvailableModels();

    return new Response(
      JSON.stringify({ models }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Models API error:', error);

    // Handle OpenRouter service errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'OpenRouterServiceError') {
      const serviceError = error as any;
      
      return new Response(
        JSON.stringify({
          error: serviceError.message,
          code: serviceError.code,
          retryable: serviceError.retryable
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve models',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};