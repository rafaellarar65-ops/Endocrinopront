/**
 * Implementação simplificada de armazenamento para ambientes de teste
 */
export async function storagePut(
  key: string,
  data: Buffer | string,
  contentType?: string
): Promise<{ url: string; contentType?: string }> {
  return {
    url: `https://storage.local/${key}`,
    contentType,
  };
}
