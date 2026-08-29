# ChapterOS - Nền tảng Quản trị Chi hội, CLB & Đoàn Hội Sinh viên

<div align="center">
  <h3>Hệ thống quản lý toàn diện dành cho Chi hội, Liên chi hội, Câu lạc bộ, Đội nhóm sinh viên</h3>
  <p>Tối ưu hóa quản lý Hội viên, Hoạt động, Điểm danh, Tài chính Thu/Chi, Google Forms & Báo cáo Nhiệm kỳ</p>
</div>

---

## 📌 Tính năng cốt lõi (Core Features)

- 🏛️ **Đa loại hình đơn vị (Multi-Organization)**: Tự động thích ứng tên gọi chức danh theo loại hình: *Chi hội (Chi hội trưởng/phó)*, *CLB (Chủ nhiệm/Phó Chủ nhiệm)*, *Đội nhóm (Đội trưởng/phó)*, *Liên Chi hội (Liên Chi trưởng/phó)*, *Đoàn Khoa (Bí thư/Phó Bí thư)*.
- 👥 **Quản lý Sổ Hội viên & Ban Chấp Hành (RBAC)**: Tách bạch rõ ràng giữa *Tài khoản quản trị viên hệ thống* và *Sổ hội viên sinh viên*, hỗ trợ phân quyền vai trò (Admin, Leader, Deputy, Treasurer, Secretary).
- 📅 **Quản lý Hoạt động & Điểm danh**:
  - Tạo hoạt động, phân công công việc, quản lý ngân sách sự kiện.
  - Điểm danh trực tiếp (*Có mặt, Vắng, Có phép*), thống kê tỷ lệ tham gia theo thời gian thực.
  - Xuất danh sách điểm danh và người tham gia ra file CSV/Excel chuẩn tiếng Việt (UTF-8 BOM).
- 📄 **Tích hợp Google Forms & Google Sheets 100% tự động**:
  - Chuẩn hóa 4 trường câu hỏi: **Họ và tên**, **MSSV**, **Lớp**, **Khóa**.
  - Dán link Google Form hoặc Google Sheet kết quả để đồng bộ tự động người đăng ký vào bảng Điểm danh.
- 💰 **Quản lý Tài chính & Quỹ đơn vị**: Theo dõi Thu/Chi, đối soát số dư theo nhiệm kỳ, xét duyệt giao dịch theo ngưỡng phê duyệt.
- 📂 **Tích hợp Google Drive & Google Calendar**: Lưu trữ tài liệu số và đồng bộ lịch sự kiện Chi hội lên Google Calendar.
- 📊 **Báo cáo & Xuất dữ liệu**: Báo cáo tổng kết nhiệm kỳ, tổng kết hoạt động phong trào và xuất Google Sheets hai chiều.

---

## 🛠️ Yêu cầu môi trường (Prerequisites)

- **Node.js**: Phiên bản `>= 18.x` (Khuyên dùng Node.js 20 LTS trở lên).
- **Trình quản lý gói**: `npm`, `yarn`, hoặc `pnpm`.
- **Cơ sở dữ liệu**: Dự án [Supabase](https://supabase.com) (PostgreSQL).
- **Google Cloud Platform (Tùy chọn)**: Để kích hoạt Google OAuth, Calendar, Drive.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy nhanh (Quick Start)

### 1. Clone mã nguồn & Cài đặt thư viện

```bash
# 1. Di chuyển vào thư mục dự án
cd chapteros11

# 2. Cài đặt các dependencies
npm install
```

### 2. Cấu hình Biến môi trường (`.env`)

Tạo hoặc chỉnh sửa tệp `.env` tại thư mục gốc với các thông số sau:

```env
# 1. Supabase Database Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# 2. Google OAuth 2.0 Client ID (Dành cho Google Calendar, Drive, Auth)
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# 3. Server Port (Tùy chọn, mặc định cổng 3000)
PORT=3000
```

> **Lưu ý**: Nếu chưa cấu hình Supabase, hệ thống sẽ tự động kích hoạt chế độ **Demo Offline / Local Storage** để bạn có thể trải nghiệm giao diện ngay lập tức.

### 3. Cấu hình Cơ sở dữ liệu Supabase

Nếu sử dụng Supabase, bạn vào **SQL Editor** trên Supabase Dashboard và chạy lần lượt các tệp migration trong thư mục `supabase/migrations/`:

```
supabase/migrations/
├── 20260814000000_initial_domain_model.sql          # Khởi tạo bảng chính (organizations, members, activities, finance...)
├── 20260814000001_storage_documents.sql             # Cấu hình storage lưu trữ tài liệu
├── 20260814000002_google_integration_foundation.sql # Bảng liên kết Google Workspace
├── 20260814000003_activity_google_forms.sql         # Bảng lưu trữ Google Forms & Responses
├── 20260814000004_google_sheets_integration.sql     # Tích hợp đồng bộ Google Sheets
├── 20260814000005_google_drive_documents.sql        # Tích hợp liên kết Google Drive
├── 20260814000006_google_calendar_and_audit_logs.sql# Nhật ký hệ thống Audit Logs & Calendar
└── ... (Các migrations nâng cấp RBAC & RLS)
```

### 4. Khởi chạy ứng dụng

```bash
# Khởi chạy đồng thời Vite Frontend (Port 5173) và Backend Server (Port 3000)
npm run dev
```

Mở trình duyệt tại: **`http://localhost:5173`**

---

## 📋 Hướng dẫn Sử dụng & Đồng bộ Google Forms

1. Vào phân hệ **Hoạt động (`/activities`)** $\rightarrow$ Chọn Hoạt động muốn liên kết.
2. Chuyển sang Tab số 6: **"Biểu mẫu"**.
3. Bấm **"+ Tạo hoặc Gắn biểu mẫu Google Form"**.
4. Tạo Google Form với 4 câu hỏi chuẩn:
   - 1️⃣ **Họ và tên** (Dạng: Trả lời ngắn)
   - 2️⃣ **MSSV** (Mã số sinh viên)
   - 3️⃣ **Lớp**
   - 4️⃣ **Khóa**
5. Dán đường dẫn Google Form (hoặc link Google Sheet phản hồi).
6. Bấm **"Lưu & Đồng bộ ngay"**:
   - Tất cả người điền đơn sẽ lập tức xuất hiện tại **Tab 2: "Người tham gia"** và **Tab 3: "Điểm danh"**.
   - Dữ liệu hoàn toàn **độc lập với Sổ Hội viên của Chi hội**, không làm lẫn lộn dữ liệu.

---

## 🏗️ Lệnh hữu ích (Available Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy môi trường phát triển (Vite Frontend + Express Server) |
| `npm run build` | Biên dịch dự án thành gói Production tối ưu (`dist/`) |
| `npm run lint` | Kiểm tra an toàn kiểu dữ liệu TypeScript (`tsc --noEmit`) |
| `npm start` | Chạy production server sau khi đã build |

---

## 📁 Cấu trúc thư mục (Architecture)

```
├── server.ts                   # Backend proxy server (Google Sheets GViz, API endpoints)
├── src/
│   ├── components/             # Các UI components tái sử dụng (Shadcn/Radix UI)
│   ├── contexts/               # React Contexts (AuthContext, ToastContext, LanguageContext)
│   ├── features/               # Các module nghiệp vụ chính:
│   │   ├── activities/         # Quản lý Hoạt động, Điểm danh, Google Forms
│   │   ├── members/            # Sổ Hội viên & Ban Chấp Hành
│   │   ├── finance/            # Quản lý Thu/Chi, Quỹ, Đối soát
│   │   ├── terms/              # Quản lý Nhiệm kỳ & Bàn giao
│   │   ├── tasks/              # Phân công & Tiến độ nhiệm vụ
│   │   ├── documents/          # Lưu trữ tài liệu & Google Drive
│   │   ├── chapters/           # Không gian làm việc & Đơn vị
│   │   └── settings/           # Cài đặt phân quyền RBAC & Hồ sơ
│   ├── integrations/           # Tích hợp Google Workspace (Forms, Sheets, Drive, Calendar)
│   ├── repositories/           # Tầng truy xuất dữ liệu Supabase & Local Storage Fallback
│   ├── services/               # Tầng xử lý logic nghiệp vụ (Business Rules)
│   └── types/                  # Định nghĩa TypeScript Domain & Database Types
└── supabase/migrations/        # SQL Migrations cho PostgreSQL Supabase
```

---

<div align="center">
  <p>Phát triển vì phong trào sinh viên và chuyển đổi số công tác Hội - Đoàn</p>
</div>
