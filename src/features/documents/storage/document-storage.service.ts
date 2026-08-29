import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DOCUMENTS_BUCKET } from '../utils/storage-path.utils';

export interface StorageUploadResult {
  path: string;
  fullPath: string;
}

/**
 * Upload binary file to Supabase Storage private bucket
 */
export async function uploadDocumentToStorage(
  file: File,
  storagePath: string
): Promise<StorageUploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Chưa cấu hình kết nối Supabase Storage.');
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    if (error.message?.includes('duplicate') || (error as any).statusCode === '409') {
      throw new Error('Tệp tin có cùng đường dẫn đã tồn tại trên hệ thống lưu trữ.');
    }
    if (error.message?.includes('Entity too large') || (error as any).statusCode === '413') {
      throw new Error('Kích thước tệp vượt quá giới hạn cấu hình Storage.');
    }
    if (error.message?.includes('row-level security') || error.message?.includes('policy') || (error as any).statusCode === '403') {
      throw new Error('Bạn không có quyền tải tệp lên thư mục của Chi hội này.');
    }
    throw new Error(error.message || 'Lỗi khi tải tệp lên hệ thống lưu trữ.');
  }

  if (!data?.path) {
    throw new Error('Không nhận được đường dẫn tệp sau khi tải lên.');
  }

  return {
    path: data.path,
    fullPath: `${DOCUMENTS_BUCKET}/${data.path}`,
  };
}

/**
 * Generate a secure time-limited Signed URL for downloading or viewing private files
 * Default expiration: 300 seconds (5 minutes)
 */
export async function createDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 300
): Promise<{ signedUrl: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { signedUrl: null, error: 'Chưa cấu hình Supabase Storage' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('Create signed URL error:', error);
      return {
        signedUrl: null,
        error: error?.message || 'Không thể tạo liên kết tải tài liệu bảo mật.',
      };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err) {
    console.error('Signed URL exception:', err);
    return {
      signedUrl: null,
      error: (err as Error).message || 'Lỗi bất ngờ khi yêu cầu liên kết tải tài liệu.',
    };
  }
}

/**
 * Trigger browser file download via temporary signed URL
 */
export async function triggerFileDownload(
  storagePath: string,
  downloadName: string
): Promise<{ success: boolean; error: string | null }> {
  const { signedUrl, error } = await createDocumentSignedUrl(storagePath, 120);

  if (error || !signedUrl) {
    return { success: false, error: error || 'Không thể tạo liên kết tải tệp' };
  }

  try {
    // Open in a new tab or trigger download element
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = downloadName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, error: null };
  } catch (err) {
    console.error('Trigger download error:', err);
    return { success: false, error: 'Không thể kích hoạt tải tệp xuống trình duyệt.' };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteDocumentFromStorage(
  storagePath: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error('Delete storage file error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Delete storage exception:', err);
    return {
      success: false,
      error: (err as Error).message || 'Lỗi khi xóa tệp khỏi hệ thống lưu trữ.',
    };
  }
}
