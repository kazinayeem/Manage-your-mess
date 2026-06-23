import { saveSecureUpload } from "@/lib/upload-storage";

export async function saveBazaarFile(file: File | null): Promise<string | null> {
  return saveSecureUpload(file, "bazaar");
}

export async function saveBazaarFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await saveBazaarFile(file);
    if (url) urls.push(url);
  }
  return urls;
}
