import storage from '@react-native-firebase/storage';

export const uploadFile = async (
  uri: string,
  fileName: string,
  fileType: string,
  userId: string | undefined,
): Promise<string> => {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `chat_files/${userId}/${timestamp}_${sanitizedName}`;

  try {
    const reference = storage().ref(storagePath);
    const task = reference.putFile(uri);
    await task;
    const downloadUrl = await reference.getDownloadURL();
    return downloadUrl;
  } catch (error: any) {
    throw error;
  }
};
