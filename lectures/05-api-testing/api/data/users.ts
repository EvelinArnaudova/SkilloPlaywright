// TESTING: Demo accounts used by API tests and API-login fixtures.
//
// In a real project these come from environment variables or a secret store
// (for example `process.env.QA_PASSWORD`), never from source code.
import type { Credentials } from '../types';

export const users = {
	admin: { email: 'admin@example.com', password: 'admin123' },
	qa: { email: 'dev@example.com', password: 'secret123' },
} satisfies Record<string, Credentials>;

export type UserKey = keyof typeof users;
