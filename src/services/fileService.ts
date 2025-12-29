import storage from '@react-native-firebase/storage';
import { Platform, Alert } from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

export interface UploadResult {
  url: string;
  fileName: string;
  fileType: 'image' | 'file';
  fileSize?: number;
}

// Placeholder type for document picker (removed for compatibility)
export interface DocumentPickerResponse {
  uri: string;
  name: string;
  type: string;
}

/**
 * اختيار صورة من المعرض
 */
export const pickImage = async (): Promise<Asset | null> => {
  return new Promise(resolve => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }

        const asset = response.assets?.[0];
        resolve(asset || null);
      },
    );
  });
};

/**
 * التقاط صورة من الكاميرا
 */
export const takePhoto = async (): Promise<Asset | null> => {
  return new Promise(resolve => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        saveToPhotos: false,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }

        const asset = response.assets?.[0];
        resolve(asset || null);
      },
    );
  });
};

/**
 * اختيار ملف من الجهاز (معطل مؤقتاً - يحتاج Storage upgrade)
 */
export const pickDocument =
  async (): Promise<DocumentPickerResponse | null> => {
    Alert.alert(
      'Feature Unavailable',
      'File sharing requires Firebase Storage upgrade. You can still share images!',
      [{ text: 'OK' }],
    );
    return null;
  };

/**
 * رفع ملف إلى Firebase Storage
 */
export const uploadFile = async (
  userId: string,
  fileUri: string,
  fileName: string,
  fileType: 'image' | 'file',
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `chat_files/${userId}/${timestamp}_${sanitizedFileName}`;

  const reference = storage().ref(storagePath);

  // رفع الملف
  await reference.putFile(fileUri);

  // الحصول على URL التحميل
  const downloadUrl = await reference.getDownloadURL();

  return {
    url: downloadUrl,
    fileName: fileName,
    fileType: fileType,
  };
};

/**
 * رفع صورة إلى Firebase Storage
 */
export const uploadImage = async (
  userId: string,
  asset: Asset,
): Promise<UploadResult> => {
  if (!asset.uri || !asset.fileName) {
    throw new Error('Invalid image asset');
  }

  return uploadFile(userId, asset.uri, asset.fileName, 'image');
};

/**
 * رفع مستند إلى Firebase Storage
 */
export const uploadDocument = async (
  userId: string,
  document: DocumentPickerResponse,
): Promise<UploadResult> => {
  if (!document.uri || !document.name) {
    throw new Error('Invalid document');
  }

  return uploadFile(userId, document.uri, document.name, 'file');
};

/**
 * حذف ملف من Firebase Storage
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const reference = storage().refFromURL(fileUrl);
    await reference.delete();
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * الحصول على امتداد الملف
 */
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

/**
 * التحقق من نوع الملف
 */
export const isImageFile = (fileName: string): boolean => {
  const ext = getFileExtension(fileName);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
};

/**
 * تنسيق حجم الملف
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
