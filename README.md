# Shift Manager Auto Check-in/Check-out

Auto check-in / check-out cho `pf-schedule-dashboard.vercel.app` qua Supabase REST API.

## 📋 Yêu cầu

- Node.js >= 18 (vì dùng `fetch` built-in, không cần `node-fetch`)
- Tài khoản đã đăng nhập trên Shift Manager để lấy được refresh token

## 🚀 Cài đặt

### Bước 1: Lấy các giá trị cần thiết

Mở trang [Shift Manager](https://pf-schedule-dashboard.vercel.app/dashboard/my-schedule) trong Chrome/Edge, đăng nhập, rồi mở DevTools (F12).

**a) Lấy SUPABASE_ANON_KEY:**
1. Tab **Network**, reload trang
2. Click bất kỳ request nào tới `qktvfncduxmoijzfqbdb.supabase.co`
3. Phần **Request Headers**, copy giá trị header `apikey` (chuỗi JWT bắt đầu `eyJhbGc...`)

**b) Lấy REFRESH_TOKEN:**
1. Tab **Application** → **Cookies** → chọn `https://pf-schedule-dashboard.vercel.app`
2. Tìm cookie tên `sb-qktvfncduxmoijzfqbdb-auth-token`
3. Copy value (bắt đầu bằng `base64-...`)
4. Mở Console, paste lệnh sau (thay `<VALUE>` bằng giá trị cookie):
   ```js
   JSON.parse(atob('<VALUE>'.replace('base64-','')))
   ```
5. Lấy field `refresh_token` từ kết quả

**c) Lấy MEMBER_ID:** mặc định đã có sẵn trong `.env.example`, nhưng nếu cần xác nhận, đó chính là field `user.id` trong cùng object JSON ở bước b.

### Bước 2: Cấu hình

```bash
cp .env.example .env
# Mở .env, điền 3 giá trị: SUPABASE_ANON_KEY, MEMBER_ID, INITIAL_REFRESH_TOKEN
```

### Bước 3: Load env và chạy thử

**Linux/macOS:**
```bash
set -a && source .env && set +a
node auto-shift.js status      # Kiểm tra shift hôm nay
```

**Windows PowerShell:**
```powershell
Get-Content .env | ForEach-Object { if ($_ -match '^(\w+)=(.*)$') { Set-Item -Path "env:$($matches[1])" -Value $matches[2] } }
node auto-shift.js status
```

Hoặc đơn giản hơn: cài `dotenv-cli`:
```bash
npm i -g dotenv-cli
dotenv -e .env -- node auto-shift.js status
```

## 🎯 Sử dụng

```bash
node auto-shift.js checkin     # Check-in cho shift hôm nay
node auto-shift.js checkout    # Check-out cho shift hôm nay
node auto-shift.js status      # Xem trạng thái shift hôm nay
```

Script tự xử lý:
- ✅ Tự refresh access token mỗi lần chạy
- ✅ Tự lưu refresh_token mới (vì Supabase rotate) vào `.shift-state.json`
- ✅ Idempotent: chạy `checkin` 2 lần không tạo 2 record
- ✅ Tự pick shift đang active nếu hôm nay có nhiều shift
- ✅ Tự suy ra `role` (`SL` nếu là Shift Leader, mặc định `FL/TS`)

## ⏰ Schedule tự động

### Linux/macOS (cron)

`crontab -e`:
```cron
# Check-in 7:00 sáng T2-T6
0 7  * * 1-5  cd /path/to/shift-auto && dotenv -e .env -- node auto-shift.js checkin  >> shift.log 2>&1

# Check-out 11:00 sáng T2-T6
0 11 * * 1-5  cd /path/to/shift-auto && dotenv -e .env -- node auto-shift.js checkout >> shift.log 2>&1
```

### Windows (Task Scheduler)

Tạo task chạy lệnh:
```
"C:\Program Files\nodejs\node.exe" "C:\path\to\auto-shift.js" checkin
```
Set Environment Variables trong task hoặc dùng wrapper `.bat` load `.env` trước.

### Docker

`Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY auto-shift.js package.json ./
ENTRYPOINT ["node", "auto-shift.js"]
```

Chạy:
```bash
docker build -t shift-auto .
docker run --rm --env-file .env -v $(pwd):/app/state shift-auto checkin
```

## 🔒 Bảo mật

- **Không commit** `.env` và `.shift-state.json` lên Git (đã có trong `.gitignore` chưa? tự tạo nhé)
- Refresh token cho phép đăng nhập tài khoản bạn, hãy bảo vệ như password
- Anon key có thể public, không sao nếu lộ
- File `.shift-state.json` được lưu với chmod 600 (chỉ owner đọc được)

## 🐛 Troubleshooting

**`Refresh token failed: 400`**
→ Refresh token đã hết hạn hoặc đã được rotate. Đăng nhập lại trên browser, lấy refresh_token mới, xóa `.shift-state.json`, cập nhật `INITIAL_REFRESH_TOKEN` trong `.env`.

**`Không có shift nào cho hôm nay`**
→ Đúng vậy, không có việc gì để làm. Script exit bình thường.

**`Check-in failed: 403`**
→ RLS chặn. Có thể shift đã bị cover, hoặc `MEMBER_ID` không match với `sub` trong JWT.

**`Check-out failed: không tìm thấy check-in đang mở`**
→ Chưa check-in, hoặc đã check-out rồi. Chạy `status` để kiểm tra.

## 📂 Cấu trúc file

```
shift-auto/
├── auto-shift.js          # Script chính
├── package.json
├── .env.example           # Template config
├── .env                   # Config thật (KHÔNG commit)
├── .shift-state.json      # State auto-generated (KHÔNG commit)
└── README.md
```

## 📡 API endpoints được sử dụng

| Endpoint | Method | Mục đích |
|---|---|---|
| `/auth/v1/token?grant_type=refresh_token` | POST | Refresh access token |
| `/rest/v1/shift_assignments` | GET | Lấy shift hôm nay |
| `/rest/v1/checkins` | GET | Tìm check-in đang mở |
| `/rest/v1/checkins` | POST | Tạo check-in mới |
| `/rest/v1/checkins?id=eq.X` | PATCH | Update check-out time |

Chi tiết schema và payload đã được document đầy đủ trong cuộc chat tạo ra repo này.