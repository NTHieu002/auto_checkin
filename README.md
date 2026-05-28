# Shift Manager Auto Check-in/Check-out

Tự động check-in / check-out trên [Shift Manager](https://pf-schedule-dashboard.vercel.app) bằng cách gọi thẳng Supabase REST API của app — kèm **thông báo Slack** giống hệt khi bấm trên web.

> 📌 Trạng thái vận hành thực tế (link, lịch cron, KV id, sự cố đã/đang xử lý) luôn nằm trong **[`STATUS.md`](STATUS.md)**.

## Có gì trong repo

Ba cách cài đặt cùng một logic, cùng nói chuyện với một Supabase project, phải đồng bộ hành vi với nhau:

| Thư mục / file | Vai trò |
|---|---|
| **`cf-worker/`** | **Bản đang chạy thật** — Cloudflare Worker `shift-auto`: UI mobile chặn PIN + API + cron tự động (T2–T6) + bắn Slack. |
| `auto-shift.js` | CLI Node.js 1 file — giữ làm **backup** chạy tay. |
| `n8n-workflow.json` | Bản dựng lại bằng n8n workflow (cron-triggered). |

## 1) Cloudflare Worker (chính)

Worker phục vụ:
- **UI** tại `/` — trang mobile, vào bằng **PIN** (secret `UI_PIN`).
- **API** `/api/status|checkin|checkout|config|login` (header `x-pin`).
- **Cron** tự check-in/out theo giờ ca, **T2–T6** (giờ ICT, cron trong `wrangler.toml` để UTC):

  | ICT | Hành động |
  |---|---|
  | 07:55 | check-in ca sáng (8–11) |
  | 11:01 | check-out ca sáng |
  | 13:55 | check-in ca chiều (14–17) |
  | 17:01 | check-out ca chiều |

  Logic idempotent & tự sửa: check-in khi `now ∈ [giờ-bắt-đầu − 5', giờ-kết-thúc)` và chưa check-in; check-out khi `now ≥ giờ-kết-thúc + 1'` và đang mở. Hằng số `CHECKIN_LEAD_MIN`/`CHECKOUT_LAG_MIN` trong `src/index.js` **phải khớp** cron trong `wrangler.toml`.

### Cấu hình & deploy

```bash
cd cf-worker
npm i                       # cài wrangler
npx wrangler secret put EMAIL
npx wrangler secret put PASSWORD     # mật khẩu Shift Manager (để worker tự login)
npx wrangler secret put UI_PIN       # PIN vào UI
npx wrangler deploy
```

- **Vars public-safe** (trong `wrangler.toml`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MEMBER_ID`.
- **KV `SHIFT_KV`** lưu: `session` (refresh token xoay vòng), `config` `{autoEnabled, skipDates, slackNotify}`, `slack_action_id` (id server-action Slack đã cache).
- Xem log: Cloudflare dashboard → Workers & Pages → `shift-auto` → **Observability**, hoặc live: `npx wrangler tail`.

## 2) Thông báo Slack

Web Shift Manager thật: sau khi ghi `checkins`, nó gọi thêm 1 **Next.js Server Action `sendSlackCheckInNotification`** → bắn tin Slack (dạng *“Member: X has checked in / Role / Shift”*). Ghi DB trực tiếp (như bot) **không** kích hoạt nó, nên worker **tự gọi lại** server action đó sau mỗi check-in/out thành công để Slack khớp với web.

- Hàm: `notifySlack()` trong `cf-worker/src/shift.js`. Dựng cookie phiên `@supabase/ssr` từ session của bot → POST `/dashboard/my-schedule` kèm `Next-Action: <id>` + body `[name, role, slot, action]`.
- `<id>` đổi mỗi lần app upstream redeploy → worker **tự cào lại** từ bundle public và cache ở KV `slack_action_id`; gửi lỗi thì cào lại 1 lần.
- **Không chặn chấm công:** lỗi Slack chỉ log. Tắt/bật bằng toggle “Báo Slack” trên UI hoặc `config.slackNotify` (mặc định bật).

## 3) CLI local (backup)

```bash
node auto-shift.js status      # Xem trạng thái ca hôm nay
node auto-shift.js checkin     # Check-in (idempotent)
node auto-shift.js checkout    # Check-out
```

Cần Node >= 18 (dùng `fetch` built-in), không deps, không build. Nạp env trước khi chạy:

```bash
npm i -g dotenv-cli
dotenv -e .env -- node auto-shift.js status
```

Cấu hình: copy `env.example` → `.env`, điền `SUPABASE_ANON_KEY`, `MEMBER_ID`, `EMAIL`, `PASSWORD`. Worker/CLI tự login bằng EMAIL/PASSWORD nên **không bắt buộc** refresh token ban đầu; nếu muốn vẫn có thể đặt `INITIAL_REFRESH_TOKEN`.

### Auth (chung cho cả worker và CLI)

Refresh-first, fallback password: thử refresh token đã lưu trước; hỏng/không có thì login `grant_type=password` bằng `EMAIL`/`PASSWORD` để tạo phiên riêng (đây là thứ giúp cron chạy không cần người). Supabase **xoay vòng** refresh token mỗi lần refresh nên token mới được lưu lại sau mỗi lần auth thành công.

## 🔒 Bảo mật

- Secret nằm ở `.env` (CLI), `cf-worker/.dev.vars` (dev local), và Cloudflare Worker secrets (prod) — **không** commit. `.env`, `.shift-state.json`, `.dev.vars`, `.wrangler/` đều trong `.gitignore`.
- **Repo này public** → giữ secret ngoài các file được track. Anon key + `MEMBER_ID` thì public được.
- Nếu lỡ để token thật vào file được track hoặc git history → **đổi/rotate** ngay.

## 📡 Supabase REST endpoints

| Endpoint | Method | Mục đích |
|---|---|---|
| `/auth/v1/token?grant_type=password` | POST | Login email+password → phiên mới |
| `/auth/v1/token?grant_type=refresh_token` | POST | Đổi refresh token lấy access token (xoay vòng refresh token) |
| `/rest/v1/shift_assignments` | GET | Ca hôm nay của `member_id` (+ embed `members!member_id(name)` cho Slack) |
| `/rest/v1/checkins` | GET | Tìm check-in đang mở / mới nhất |
| `/rest/v1/checkins` | POST | Tạo check-in (lưu ý: bảng **không có** cột `role`) |
| `/rest/v1/checkins?id=eq.X` | PATCH | Cập nhật `checkout_time` |
