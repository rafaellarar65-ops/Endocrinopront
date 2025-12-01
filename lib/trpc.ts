// Client-side tRPC stub for UI components and tests
// This proxy avoids runtime crashes in this static environment.
const queryStub = () => ({ data: undefined, isLoading: false, isError: false, refetch: () => {}, error: null });
const mutationStub = () => ({ mutateAsync: async (_?: any) => undefined, isLoading: false, error: null });

export const trpc: any = new Proxy(
  {},
  {
    get: () => ({
      useQuery: queryStub,
      useMutation: mutationStub,
    }),
  }
);
