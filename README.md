# Trung Hoa cổ đại – Nền văn minh của sáng chế

Website thuyết trình (scrollytelling) cho bài Lịch sử 10 về bốn phát minh của Trung Hoa cổ đại.

- Nội dung: [`docs/content.md`](docs/content.md), là nguồn chữ duy nhất. Trong code, chữ nằm ở [`src/content/content.ts`](src/content/content.ts).
- Thiết kế: [`docs/design.md`](docs/design.md).

## Chạy

```bash
npm install
npm run dev
```

```bash
npm run build
```

Bản thử riêng cho cảnh bay 3D: mở `/hero-prototype.html` khi đang chạy `npm run dev`. Thêm `?p=0.5` để xem một vị trí cố định, `?cap=1` để chụp khung hình (xem mục Công cụ dev).

## Phím tắt khi thuyết trình

| Phím | Tác dụng |
|---|---|
| `P` | Bật/tắt chế độ thuyết trình |
| `→` `↓` `Space` `PageDown` | Điểm dừng tiếp theo (clicker thường gửi PageDown) |
| `←` `↑` `PageUp` | Quay lại |
| `Esc` | Thoát chế độ thuyết trình |
| `M` | Tắt/bật âm thanh |
| `1`–`4` | Chọn đáp án câu đố |

Đại tua ngược và tua nhanh tự chạy khi bấm "tiếp" ở điểm dừng đầu cảnh.

## Tài nguyên nhóm cần thêm

Mọi ô ảnh đều có khung chờ vẽ nét mực, ghi tên file cần thêm. Chép ảnh WebP đúng tên vào `public/img/` là ảnh tự thay khung chờ.

| Thư mục / file | Nội dung |
|---|---|
| `public/img/rewind-*.webp` | 18 trang đại tua ngược (`rewind-2026`, `rewind-1949`, … `rewind-xuanthu`) |
| `public/img/forward-qin.webp`, `forward-xihan.webp`, `forward-caolun.webp` | 3 khung chạy tiến |
| `public/img/tgkw-paper-1…5.webp` | Tranh khắc gỗ *Thiên công khai vật* (ảnh thật, Wikimedia Commons) |
| `public/img/print-wood-1…6`, `print-type-1…7`, `print-after-1…2` | Quy trình in |
| `public/img/powder-1…7`, `compass-1…7` | Quy trình thuốc súng, la bàn |
| `public/img/why-paper`, `why-print`, `why-powder`, `why-compass` | Minh họa "Vì sao ra đời" |
| `public/img/ai/<chương>-1.webp`, `-2.webp` | Ảnh chụp màn hình phản tư AI thật (`giay`, `in`, `thuocsung`, `laban`) |
| `public/img/dragon-claw.svg` | Móng rồng (tùy chọn) |
| `public/audio/bgm.mp3`, `drum.mp3`, `brush.mp3`, `stamp.mp3`, `paper.mp3` | Âm thanh. Thiếu file thì trang im lặng, không báo lỗi |
| `public/textures/paper.webp` | Vân giấy tuyên (tùy chọn). Nếu không có, trang tự vẽ vân giấy |

Ảnh nào tạo bằng AI sẽ có dòng "Minh họa tạo bằng AI" dưới ảnh. Ảnh bằng chứng lịch sử phải là ảnh thật và ghi nguồn trong mục Nguồn tham khảo (`src/content/content.ts` → `finale.sources`).

## Cảnh bay Tử Cấm Thành

- Mã nguồn: `src/three/forbiddenCityFlyover.ts` và `src/three/fc/`. Mô hình dựng hoàn toàn bằng code: mái cong kiểu vũ điện, yết sơn, mái chóp; ngói lưu ly, cột, đấu củng, lan can đá; vật liệu vẽ bằng canvas. Không dùng ảnh hay mô hình của bên thứ ba.
- Kích thước và bố cục lấy theo số liệu công khai, xem [`docs/flyover-sources.md`](docs/flyover-sources.md).
- Nếu máy yếu (dưới 50 FPS), trang tự giảm chất lượng: tắt AO rồi tắt bóng đổ.

## Công cụ dev

- `vite.config.ts` có plugin `dev-shots`, chỉ chạy khi `npm run dev`: nhận khung hình qua `POST /__shot?name=…` và lưu vào `.shots/`.
- Ở chế độ dev, `window.__gsap` và `window.__ST` được gán để có thể tự tick khi tab chạy nền.
