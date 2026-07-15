import { Hono } from 'hono';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';
import { context, redis } from '@devvit/web/server';
import { initializeStory } from '../services/story-init';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    // Initialize story data
    await initializeStory(redis);
    
    const input = await c.req.json<OnAppInstallRequest>();

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Story initialized in subreddit ${context.subredditName} (trigger: ${input.type})`,
      },
      200
    );
  } catch (error) {
    console.error(`Error initializing app: ${error}`);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to initialize app',
      },
      400
    );
  }
});
