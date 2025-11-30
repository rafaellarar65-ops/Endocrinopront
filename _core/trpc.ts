import { initTRPC, TRPCError } from '@trpc/server';
import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create();

const enforceUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' });
  }
  return next({ ctx });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUser);
