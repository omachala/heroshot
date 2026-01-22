import type { Page } from 'playwright';
import type { z } from 'zod';
import type { actionSchema } from '../../actionSchema';

/** Single action type inferred from the discriminated union */
export type Action = z.infer<typeof actionSchema>;

/** Handler function signature for action execution */
export type ActionHandler = (page: Page, action: Action) => Promise<void> | void;
