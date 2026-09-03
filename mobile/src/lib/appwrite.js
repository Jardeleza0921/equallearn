import 'react-native-url-polyfill/auto';
import { Account, Client, ID, InputFile, Permission, Role, Storage } from 'react-native-appwrite';

export const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '6a99736e001b37a046a9';
export const APPWRITE_BUCKET_ID = '6a997618001818031481';
export const APPWRITE_PLATFORM = 'com.equallearn.app';

export const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setPlatform(APPWRITE_PLATFORM);

export const appwriteAccount = new Account(appwriteClient);
export const appwriteStorage = new Storage(appwriteClient);

let sessionPromise = null;
export async function ensureAppwriteStorageSession() {
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    try {
      return await appwriteAccount.get();
    } catch {
      try {
        await appwriteAccount.createAnonymousSession();
        return await appwriteAccount.get();
      } catch (error) {
        sessionPromise = null;
        throw new Error(error?.message || 'Unable to start the Appwrite storage session.');
      }
    }
  })();
  return sessionPromise;
}

export function appwriteFileViewUrl(fileId) {
  if (!fileId) return '';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`;
}

export function appwriteFileDownloadUrl(fileId) {
  if (!fileId) return '';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${encodeURIComponent(fileId)}/download?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`;
}

export async function uploadMobileAsset(asset) {
  if (!asset?.uri) throw new Error('Choose a file first.');
  if (Number(asset.size || 0) > 20 * 1024 * 1024) throw new Error('Files must be 20 MB or smaller.');
  const user = await ensureAppwriteStorageSession();
  const name = asset.name || `equallearn-${Date.now()}`;
  const input = InputFile.fromPath(asset.uri, name);
  const created = await appwriteStorage.createFile({
    bucketId: APPWRITE_BUCKET_ID,
    fileId: ID.unique(),
    file: input,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ],
  });
  return {
    id: created.$id,
    name: created.name || name,
    mimeType: created.mimeType || asset.mimeType || '',
    size: Number(created.sizeOriginal || asset.size || 0),
    viewUrl: appwriteFileViewUrl(created.$id),
    downloadUrl: appwriteFileDownloadUrl(created.$id),
  };
}
