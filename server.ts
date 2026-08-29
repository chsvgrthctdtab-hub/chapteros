import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { JWT } from 'google-auth-library';

const PORT = 3000;
const app = express();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Parse json & urlencoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for direct streaming/upload to Google Drive
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

interface ServiceAccountConfig {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/**
 * Load Google Service Account Configuration (Method 1)
 */
function loadServiceAccountConfig(): ServiceAccountConfig | null {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.warn('[Service Account] JSON parse error from env:', e);
    }
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_PROJECT_ID,
    };
  }

  const possiblePaths = [
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    path.join(process.cwd(), 'service-account.json'),
    path.join(process.cwd(), 'service-account.json.json'),
    path.join(process.cwd(), 'service_account.json'),
  ].filter(Boolean) as string[];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.client_email && parsed.private_key) {
          return parsed;
        }
      } catch (e) {
        console.warn('[Service Account] File read error from', p, e);
      }
    }
  }

  return null;
}

let cachedServiceAccountToken: { token: string; expiresAt: number } | null = null;

async function getServiceAccountAccessToken(): Promise<string | null> {
  const config = loadServiceAccountConfig();
  if (!config?.client_email || !config?.private_key) {
    return null;
  }

  if (cachedServiceAccountToken && cachedServiceAccountToken.expiresAt > Date.now() + 300000) {
    return cachedServiceAccountToken.token;
  }

  try {
    const auth = new JWT({
      email: config.client_email,
      key: config.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/forms.body',
        'https://www.googleapis.com/auth/forms.responses.readonly',
      ],
    });

    const tokenRes = await auth.getAccessToken();
    if (tokenRes.token) {
      cachedServiceAccountToken = {
        token: tokenRes.token,
        expiresAt: Date.now() + 3500000,
      };
      console.log(`[Google Service Account] Authenticated successfully as ${config.client_email}`);
      return tokenRes.token;
    }
  } catch (err) {
    console.error('[Google Service Account JWT Auth Error]:', err);
  }
  return null;
}

/**
 * Helper to extract real Google Drive Folder ID from URL or String
 */
function extractDriveFolderId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (str.includes('/folders/')) {
    const match = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
  if (!str.includes('/') && !str.includes(':')) {
    return str;
  }
  return null;
}

/**
 * Helper to resolve active Google token
 */
async function resolveGoogleAccessToken(organizationId?: string, userId?: string, clientToken?: string | null): Promise<string | null> {
  // 0. Direct client token
  if (clientToken && clientToken.trim()) {
    return clientToken.trim();
  }

  // 1. User / Org OAuth Connection (Priority 1 - User has 15GB real quota)
  if (supabaseAdmin && (organizationId || userId)) {
    try {
      let connQuery = supabaseAdmin
        .from('google_connections')
        .select('metadata, status')
        .eq('status', 'connected');

      if (organizationId) {
        connQuery = connQuery.eq('organization_id', organizationId);
      } else if (userId) {
        connQuery = connQuery.eq('user_id', userId);
      }

      const { data: connData } = await connQuery.maybeSingle();
      if (connData?.metadata) {
        const meta = connData.metadata as Record<string, any>;
        const token = meta.access_token || meta.accessToken;
        if (token) {
          console.log('[Google Auth] Using live OAuth Access Token from google_connections');
          return token;
        }
      }
    } catch (err) {
      console.warn('[Google Token Lookup] error:', err);
    }
  }

  // 2. Direct Environment Access Token
  if (process.env.GOOGLE_DRIVE_ACCESS_TOKEN) {
    return process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  }

  // 3. Service Account
  const saToken = await getServiceAccountAccessToken();
  if (saToken) {
    return saToken;
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ChapterOS Backend',
  });
});

/**
 * Service Account Status Endpoint
 */
app.get('/api/drive/service-account/status', (req, res) => {
  const config = loadServiceAccountConfig();
  if (config?.client_email) {
    res.json({
      configured: true,
      email: config.client_email,
      projectId: config.project_id || 'google-cloud',
    });
  } else {
    res.json({
      configured: false,
      email: null,
      instruction: 'Chưa tìm thấy file service-account.json trong thư mục gốc dự án.',
    });
  }
});

/**
 * Endpoint to clean up test folders/documents except 'abcdex'
 */
app.post('/api/drive/cleanup-test-folders', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Database admin not initialized' });
    }

    const { data: allDocs, error: fetchErr } = await supabaseAdmin
      .from('documents')
      .select('id, title, file_path');

    if (fetchErr) {
      return res.status(500).json({ success: false, error: fetchErr.message });
    }

    const toDelete = (allDocs || []).filter((d: any) => {
      const t = (d.title || '').toLowerCase().trim();
      const p = (d.file_path || '').toLowerCase().trim();
      // Keep only 'abcdex'
      if (t === 'abcdex' || p.startsWith('abcdex/')) return false;
      return true;
    });

    if (toDelete.length > 0) {
      const ids = toDelete.map((d: any) => d.id);
      const { error: delErr } = await supabaseAdmin.from('documents').delete().in('id', ids);
      if (delErr) {
        return res.status(500).json({ success: false, error: delErr.message });
      }
      console.log(`[Clean Test Folders] Successfully removed ${ids.length} test records from DB:`, toDelete.map((d: any) => d.title));
      return res.json({ success: true, deletedCount: ids.length, deletedTitles: toDelete.map((d: any) => d.title) });
    }

    return res.json({ success: true, deletedCount: 0, message: 'Không còn thư mục test nào cần xóa.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Direct Google Drive Delete Endpoint (Deletes directly from Google Drive Cloud)
 */
app.post('/api/drive/delete', async (req, res) => {
  try {
    const { driveFileId, organizationId, userId } = req.body;
    if (!driveFileId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã tệp Google Drive cần xóa.' });
    }

    const clientToken = (req.headers['x-google-access-token'] as string) || req.body.googleAccessToken || null;
    const accessToken = await resolveGoogleAccessToken(organizationId, userId, clientToken);

    if (accessToken && !driveFileId.startsWith('gfolder-') && !driveFileId.startsWith('gfile-')) {
      try {
        console.log(`[Google Drive Delete] Deleting file/folder ${driveFileId} on Google Drive...`);
        // 1. Move to trash (works reliably for all editors)
        const trashRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${driveFileId}?supportsAllDrives=true`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trashed: true }),
          }
        );

        if (trashRes.ok) {
          console.log(`[Google Drive Delete] Successfully moved ${driveFileId} to Trash.`);
        } else {
          // 2. Fallback to hard delete
          const driveRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${driveFileId}?supportsAllDrives=true`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (driveRes.ok || driveRes.status === 204) {
            console.log(`[Google Drive Delete] Permanently deleted ${driveFileId}.`);
          } else {
            console.warn('[Google Drive Delete API] Response:', await driveRes.text());
          }
        }
      } catch (driveErr) {
        console.warn('[Google Drive Delete API] Network error:', driveErr);
      }
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from('documents').delete().or(`id.eq.${driveFileId},drive_file_id.eq.${driveFileId}`);
    }

    return res.json({ success: true, message: 'Đã xóa tệp khỏi Google Drive và hệ thống.' });
  } catch (error: any) {
    console.error('[Google Drive Delete] Internal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint to create a real Google Drive folder
 */
app.post('/api/drive/create-folder', async (req, res) => {
  try {
    const { organizationId, folderName, parentFolderId, driveUrl, userId, userEmail } = req.body;
    if (!organizationId || !folderName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp tên thư mục và mã Đơn vị.',
      });
    }

    const trimmedName = folderName.trim();
    let driveFolderId: string | null = extractDriveFolderId(driveUrl);
    let driveViewUrl: string | null = driveUrl || null;

    const clientToken = (req.headers['x-google-access-token'] as string) || req.body.googleAccessToken || null;
    const accessToken = await resolveGoogleAccessToken(organizationId, userId, clientToken);

    if (accessToken && !driveFolderId) {
      try {
        const payloadBody: Record<string, any> = {
          name: trimmedName,
          mimeType: 'application/vnd.google-apps.folder',
        };

        const targetParentId = extractDriveFolderId(parentFolderId) || extractDriveFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
        if (targetParentId) {
          payloadBody.parents = [targetParentId];
        }

        const driveResponse = await fetch(
          'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadBody),
          }
        );

        if (driveResponse.ok) {
          const created = (await driveResponse.json()) as any;
          driveFolderId = created.id;
          driveViewUrl = created.webViewLink;
          console.log(`[Google Drive Folder Created] ID: ${driveFolderId}, Name: ${trimmedName}`);

          // Automatically share with user's email so it appears in their Google Drive!
          const targetEmail = userEmail || process.env.DEFAULT_GOOGLE_USER_EMAIL;
          if (targetEmail && targetEmail.includes('@') && driveFolderId) {
            try {
              await fetch(`https://www.googleapis.com/drive/v3/files/${driveFolderId}/permissions`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  role: 'writer',
                  type: 'user',
                  emailAddress: targetEmail,
                }),
              });
              console.log(`[Google Drive Permissions] Auto-shared folder "${trimmedName}" with ${targetEmail}`);
            } catch (permErr) {
              console.warn('[Google Drive Permissions auto-share notice]', permErr);
            }
          }
        } else {
          console.warn('[Google Drive Create Folder API] non-ok response:', await driveResponse.text());
        }
      } catch (driveErr) {
        console.warn('[Google Drive Create Folder API] network error:', driveErr);
      }
    }

    const generatedId = driveFolderId || `gfolder-${Date.now()}`;
    const generatedUrl = driveViewUrl || `https://drive.google.com/drive/folders/${generatedId}`;

    return res.json({
      success: true,
      folder: {
        id: generatedId,
        name: trimmedName,
        webViewLink: generatedUrl,
      },
    });
  } catch (error: any) {
    console.error('[Create Folder Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi tạo thư mục.',
    });
  }
});

/**
 * Direct Google Drive Upload Endpoint
 */
app.post('/api/drive/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy tệp tin cần tải lên.',
      });
    }

    const organizationId = req.body.organizationId;
    const userId = req.body.userId;
    const userEmail = req.body.userEmail || null;
    const customTitle = req.body.title || file.originalname.replace(/\.[^/.]+$/, '');
    const folderId = req.body.folderId || null;
    const folderName = req.body.folderName || null;

    const computedFilePath = folderName ? `${folderName}/${file.originalname}` : file.originalname;

    const clientToken = (req.headers['x-google-access-token'] as string) || req.body.googleAccessToken || null;
    let googleAccessToken = await resolveGoogleAccessToken(organizationId, userId, clientToken);

    console.log(`[Google Drive Upload] Processing file "${file.originalname}" (${file.size} bytes) for org "${organizationId}", folder: "${folderName || 'root'}"`);

    // 1. If live Google Access Token (Service Account or OAuth) is present, upload via Google Drive REST API v3 Multipart
    if (googleAccessToken) {
      try {
        const targetParentId = extractDriveFolderId(folderId) || extractDriveFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
        const metadata: Record<string, any> = {
          name: file.originalname,
          mimeType: file.mimetype,
          ...(targetParentId ? { parents: [targetParentId] } : {}),
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody = Buffer.concat([
          Buffer.from(
            delimiter +
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              `Content-Type: ${file.mimetype}\r\n\r\n`
          ),
          file.buffer,
          Buffer.from(closeDelimiter),
        ]);

        const driveResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,iconLink,size,createdTime',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${googleAccessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
              'Content-Length': String(multipartRequestBody.length),
            },
            body: multipartRequestBody,
          }
        );

        if (driveResponse.ok) {
          const driveFile = (await driveResponse.json()) as any;
          console.log(`[Google Drive Upload] Successfully uploaded to Google Drive ID: ${driveFile.id}`);

          // Auto-share with user's email so it appears in their Google Drive
          const targetEmail = userEmail || process.env.DEFAULT_GOOGLE_USER_EMAIL;
          if (targetEmail && targetEmail.includes('@') && driveFile.id) {
            try {
              await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${googleAccessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  role: 'writer',
                  type: 'user',
                  emailAddress: targetEmail,
                }),
              });
              console.log(`[Google Drive Permissions] Auto-shared file "${file.originalname}" with ${targetEmail}`);
            } catch (permErr) {
              console.warn('[Google Drive Permissions auto-share notice]', permErr);
            }
          }

          return res.json({
            success: true,
            file: {
              id: driveFile.id,
              name: customTitle,
              filePath: computedFilePath,
              mimeType: driveFile.mimeType || file.mimetype,
              webViewLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
              webContentLink: driveFile.webContentLink || null,
              iconLink: driveFile.iconLink || null,
              size: Number(driveFile.size) || file.size,
              createdTime: driveFile.createdTime || new Date().toISOString(),
            },
          });
        } else {
          const errText = await driveResponse.text();
          console.warn('[Google Drive Upload] Google API error, fallback:', errText);
        }
      } catch (driveErr) {
        console.warn('[Google Drive Upload] API error, fallback:', driveErr);
      }
    }

    // 2. Return file info for client-side authenticated database link
    const localFileId = `gfile-${Date.now()}`;
    return res.json({
      success: true,
      file: {
        id: localFileId,
        name: customTitle,
        filePath: computedFilePath,
        mimeType: file.mimetype,
        webViewLink: `https://drive.google.com/file/d/${localFileId}/view`,
        size: file.size,
        createdTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Google Drive Upload] Internal server error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi tải tệp lên Google Drive.',
    });
  }
});

/**
 * Endpoint: POST /api/forms/create
 * Creates a real Google Form with pre-populated questions via Google Forms API v1
 */
app.post('/api/forms/create', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const token = await getServiceAccountAccessToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Google Service Account hoặc tài khoản Google Workspace chưa được cấu hình trên hệ thống.',
      });
    }

    // 1. Create Form via Google Forms API
    const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title: title || 'Biểu mẫu đăng ký hoạt động',
          documentTitle: title || 'Biểu mẫu đăng ký hoạt động',
          description: description || '',
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.warn('[Google Forms API Create Error]:', errText);
      return res.status(createRes.status).json({
        success: false,
        error: `Lỗi Google Forms API: ${errText}`,
      });
    }

    const formData = await createRes.json();
    const formId = formData.formId;
    const responderUri = formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
    const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

    // 2. Add question items via batchUpdate
    const items =
      questions && Array.isArray(questions) && questions.length > 0
        ? questions
        : [
            { title: 'Họ và tên', required: true },
            { title: 'Mã số sinh viên (MSSV)', required: true },
            { title: 'Địa chỉ Email', required: false },
            { title: 'Số điện thoại', required: false },
            { title: 'Lớp sinh hoạt / Khoa', required: false },
          ];

    const requests = items.map((q: any, idx: number) => ({
      createItem: {
        item: {
          title: q.title,
          description: q.description || null,
          questionItem: {
            question: {
              required: Boolean(q.required),
              textQuestion: {
                paragraph: Boolean(q.paragraph),
              },
            },
          },
        },
        location: {
          index: idx,
        },
      },
    }));

    if (requests.length > 0) {
      try {
        const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests,
          }),
        });

        if (!updateRes.ok) {
          const updateErr = await updateRes.text();
          console.warn('[Google Forms BatchUpdate Warning]:', updateErr);
        }
      } catch (batchErr) {
        console.warn('[Google Forms BatchUpdate Exception]:', batchErr);
      }
    }

    return res.json({
      success: true,
      formId,
      responderUri,
      editUrl,
      title: formData.info?.title || title,
      description: formData.info?.description || description,
    });
  } catch (err: any) {
    console.error('[Google Forms Create Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi khởi tạo biểu mẫu Google Forms',
    });
  }
});

/**
 * Endpoint: GET /api/forms/responses/:formId
 * Fetches real responses from Google Forms API
 */
app.get('/api/forms/responses/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const token = await getServiceAccountAccessToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Google Service Account chưa được cấu hình.',
      });
    }

    const fetchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return res.status(fetchRes.status).json({
        success: false,
        error: errText,
      });
    }

    const data = await fetchRes.json();
    return res.json({
      success: true,
      responses: data.responses || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Endpoint to fetch Google Sheets responses (via CSV or Google Sheets API)
 */
app.all(['/api/sheets/responses/:sheetId', '/api/sheets/fetch'], async (req, res) => {
  try {
    const rawParam = req.params.sheetId || (req.query.sheetId as string) || (req.query.sheetUrl as string) || (req.query.url as string) || (req.body?.sheetUrl as string);
    if (!rawParam) {
      return res.status(400).json({ success: false, error: 'Thiếu đường dẫn hoặc ID Google Sheet.' });
    }

    const idMatch = rawParam.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = idMatch ? idMatch[1] : rawParam.trim();
    const gidMatch = rawParam.match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : (req.query.gid as string) || '';

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/csv,application/json,text/plain,*/*',
    };

    // 1. Try public export CSV via Google Visualization API (with gid if specified)
    const gvizUrl = gid
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
      : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    try {
      const gvizRes = await fetch(gvizUrl, {
        headers,
        redirect: 'follow',
      });
      if (gvizRes.ok) {
        const csvContent = await gvizRes.text();
        if (csvContent && !csvContent.includes('<!DOCTYPE') && !csvContent.includes('google-site-verification') && csvContent.length > 5) {
          return res.json({
            success: true,
            format: 'csv',
            data: csvContent,
          });
        }
      }
    } catch (gvizErr) {
      console.warn('[Google Sheets GViz] Fetch warning:', gvizErr);
    }

    // 2. Try standard export CSV endpoint (with gid if specified)
    const exportUrl = gid
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
      : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    try {
      const exportRes = await fetch(exportUrl, {
        headers,
        redirect: 'follow',
      });
      if (exportRes.ok) {
        const exportContent = await exportRes.text();
        if (exportContent && !exportContent.includes('<!DOCTYPE') && exportContent.length > 5) {
          return res.json({
            success: true,
            format: 'csv',
            data: exportContent,
          });
        }
      }
    } catch (exportErr) {
      console.warn('[Google Sheets Export CSV] Fetch warning:', exportErr);
    }

    // 3. Try Google Sheets API with user token or service account token
    const clientToken = (req.headers['x-google-access-token'] as string) || null;
    const token = clientToken || (await getServiceAccountAccessToken());
    if (token) {
      const sheetApiRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z500`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (sheetApiRes.ok) {
        const sheetJson = await sheetApiRes.json();
        const rows: string[][] = sheetJson.values || [];
        if (rows.length > 0) {
          // Convert 2D array to CSV format
          const csvText = rows
            .map((r) =>
              r
                .map((cell) => {
                  const s = String(cell || '');
                  return s.includes(',') || s.includes('"') || s.includes('\n')
                    ? `"${s.replace(/"/g, '""')}"`
                    : s;
                })
                .join(',')
            )
            .join('\n');

          return res.json({
            success: true,
            format: 'csv',
            data: csvText,
          });
        }
      }
    }

    return res.status(403).json({
      success: false,
      errorType: 'permission_denied',
      error: 'Google Sheet đang ở chế độ Riêng tư (Hạn chế). Vui lòng mở Google Sheet -> Bấm nút "Chia sẻ" ở góc phải -> Chuyển sang "Bất kỳ ai có đường liên kết" (Người xem) rồi bấm "Đồng bộ phản hồi" lại.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChapterOS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
