import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Browser MSW worker, started only in development from the providers tree. */
export const worker = setupWorker(...handlers);
