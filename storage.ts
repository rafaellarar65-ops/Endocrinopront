export interface StoragePutResult {
  url: string;
  key?: string;
  contentType?: string;
}

/**
 * Implementação simplificada de armazenamento para ambientes de teste
 */
export async function storagePut(
  key: string,
  content: Buffer | string,
  contentType?: string
): Promise<StoragePutResult> {
  void content;

  return { url: `https://storage.local/${key}`, key, contentType };
}

export async function uploadPdfBuffer(
  key: string,
  pdfBuffer: Buffer
): Promise<{ pdfUrl: string; pdfPath: string }> {
  const { url: pdfUrl } = await storagePut(key, pdfBuffer, "application/pdf");

  return { pdfUrl, pdfPath: key };
}
