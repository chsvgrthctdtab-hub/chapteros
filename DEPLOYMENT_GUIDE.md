# 📘 HƯỚNG DẪN TRIỂN KHAI, CẬP NHẬT TỰ ĐỘNG & XỬ LÝ SỰ CỐ (CHAPTEROS DEPLOYMENT GUIDE)

---

## 1. 🚀 Hướng Dẫn Phát Hành Lần Đầu (Initial Publish)

### Cách 1: Triển khai miễn phí trên Vercel (Khuyên dùng - 2 phút)
1. Đẩy toàn bộ mã nguồn lên một Repository mới trên **GitHub**.
2. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
3. Bấm **"Add New..."** ➔ Chọn **"Project"** ➔ Chọn Repository vừa tạo.
4. Tại mục **Environment Variables**, thêm 2 biến từ file `.env`:
   - `VITE_SUPABASE_URL`: Đường dẫn Supabase của bạn
   - `VITE_SUPABASE_ANON_KEY`: Khóa công khai Anon Key
5. Bấm **"Deploy"**. Trong vòng 1 phút, bạn sẽ có đường link website chính thức (ví dụ: `https://chapteros-yourorg.vercel.app`).

### Cách 2: Triển khai trên VPS / Server riêng (Node.js / PM2)
```bash
# 1. Cài đặt thư viện
npm install

# 2. Tạo bản build sản phẩm
npm run build

# 3. Khởi chạy máy chủ chạy ngầm 24/7 với PM2
pm2 start dist/server.cjs --name "chapteros"
pm2 save
```

---

## 2. ⚡ Quy Trình Cập Nhật Tính Năng (Update Workflow)

### Cập nhật tự động (CI/CD với Git & Vercel):
Mỗi khi bạn muốn sửa giao diện hoặc thêm tính năng mới:

1. **Bước 1 (Kiểm tra an toàn trước khi đẩy)**:
   Chạy lệnh kiểm tra toàn diện 3 trong 1:
   ```bash
   npm run check:all
   ```
   *(Lệnh này tự động kiểm tra lỗi cú pháp TypeScript, chạy bộ Test Suite và Build thử)*.

2. **Bước 2 (Đẩy code lên GitHub)**:
   ```bash
   git add .
   git commit -m "feat: cap nhat tinh nang diem danh moi"
   git push origin main
   ```

3. **Bước 3 (Hoàn tất)**:
   Vercel / GitHub Actions sẽ tự động nhận diện code mới, build và cập nhật phiên bản website trong vòng **30 giây** mà không làm gián đoạn người dùng.

---

## 3. 🛡️ Xử Lý Sự Cố Khẩn Cấp (Emergency Handling)

### Tình huống 1: Bản cập nhật mới bị lỗi ngoài ý muốn ➔ Hoàn tác (Rollback)
- **Trên Vercel**:
  1. Mở trang quản trị dự án trên Vercel ➔ Chọn tab **Deployments**.
  2. Tìm phiên bản chạy ổn định trước đó ➔ Bấm vào dấu `...` ➔ Chọn **"Instant Rollback"**.
  3. Hệ thống sẽ quay trở lại phiên bản cũ ngay lập tức trong **1 giây**.

- **Trên Git**:
  ```bash
  git revert HEAD
  git push origin main
  ```

---

### Tình huống 2: Người dùng báo bị lỗi hiển thị dữ liệu cũ ➔ Xóa Cache
- Nhờ người dùng bấm tổ hợp phím **`Ctrl + F5`** (Windows) hoặc **`Cmd + Shift + R`** (Mac) để tải lại phiên bản web mới nhất từ máy chủ.

---

## 4. 🗄️ Cập Nhật Cơ Sở Dữ Liệu (Database Migration)
- Dữ liệu người dùng được lưu trữ độc lập trên **Supabase Cloud**.
- Khi cần thêm cột mới hoặc bảng mới, hãy thực hiện qua giao diện **Table Editor** hoặc **SQL Editor** trên Supabase Dashboard trước, sau đó mới cập nhật mã nguồn frontend.
