import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_ENDPOINT: z.string().url('Invalid API endpoint'),
    NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL')
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
  },
  skipValidation: process.env.NODE_ENV !== 'production'
});
