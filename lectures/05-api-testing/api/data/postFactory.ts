// TESTING: Builds unique post payloads used to seed isolated API and UI tests.
//
// Every call returns a UNIQUE title, so tests running in parallel never find each other's
// data, and a test only overrides the fields it cares about:
//   buildPost()                      -> a valid draft
//   buildPost({ published: true })   -> a valid published post
import { randomUUID } from 'node:crypto';
import type { CreatePostInput } from '../types';

export function buildPost(overrides: Partial<CreatePostInput> = {}): Required<CreatePostInput> {
	return {
		title: `Test post ${randomUUID().slice(0, 8)}`,
		body: 'Created by a Playwright test',
		published: false,
		...overrides,
	};
}
