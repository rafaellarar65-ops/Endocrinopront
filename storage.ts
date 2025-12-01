export interface StoragePutResult {
  url: string;
  key?: string;
}

export async function storagePut(
  key: string,
  _content: Buffer | string,
  _contentType: string
): Promise<StoragePutResult> {
  return { url: `https://storage.local/${key}`, key };
}
