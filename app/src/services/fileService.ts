import storage from '@react-native-firebase/storage';
import { Platform, Alert } from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';

export interface UploadResult {
  url: string;
  fileName: string;
  fileType: 'image' | 'file';
  fileSize?: number;
}

export interface DocumentPickerResponse {
  uri: string;
  name: string;
  type: string;
  size?: number;
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
 * اختيار ملف من الجهاز
 */
export const pickDocument =
  async (): Promise<DocumentPickerResponse | null> => {
    try {
      const [result] = await pick({
        type: [types.allFiles],
        mode: 'open',
      });

      if (result) {
        return {
          uri: result.uri,
          name: result.name || 'document',
          type: result.type || 'application/octet-stream',
          size: result.size || undefined,
        };
      }
      return null;
    } catch (error: any) {
      // User cancelled - not an error
      if (
        error?.code === 'DOCUMENT_PICKER_CANCELED' ||
        error?.message?.includes('cancel')
      ) {
        return null;
      }
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.', [
        { text: 'OK' },
      ]);
      return null;
    }
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
  } catch (error) {}
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
