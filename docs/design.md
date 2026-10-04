# design.md — "Trung Hoa cổ đại – Nền văn minh của sáng chế"

> Tài liệu thiết kế cho Claude Code. Đọc hết file này và `content.md` trước khi viết dòng code nào.
> `content.md` là nguồn chữ duy nhất. Không tự thêm sự kiện, năm, trích dẫn hay câu chữ lịch sử.

## Ghi chú triển khai (cập nhật khi dựng)

| Mục trong thiết kế | Cách đã làm |
|---|---|
| Hero 3D "low-poly phẳng, viền nét mực, không tone mapping" | Theo yêu cầu mới của nhóm: **flyover chân thực**. Mô hình dựng bằng code theo số liệu thật, có bầu trời vật lý, bóng đổ, AO, tone mapping ACES và sương mù buổi sáng. Cuối chuyến bay, một lớp giấy phủ lên khung hình để chuyển sang nền giấy |
| Ghim cảnh bằng ScrollTrigger `pin` | Dùng CSS `position: sticky` trong "track" cao, còn ScrollTrigger chỉ đọc tiến độ. Không có pin-spacer, nên các điểm neo của rồng giữ đúng vị trí |
| `forbiddenCityFlyover.js`, `HeroFlyover.tsx` "đã có sẵn" | Viết mới: `src/three/forbiddenCityFlyover.ts` và `src/components/HeroFlyover.tsx`. Cùng API `{ start, stop, intro, setProgress, setPointer, resize, dispose }`, thêm `renderFrame`, `setQuality` |
| Đầu rồng `/img/dragon-head.svg` | Hiện là đầu rồng vẽ bằng code (tạm thời), cần thay bằng bản vẽ thật |
| `content.ts` | Chép đầy đủ nội dung. Bỏ ký hiệu ⚠ khi hiển thị. Các ghi chú dành cho nhóm (vd. "Gợi ý: đây chính là lỗi…") không hiện lên trang |

## 1. Tóm tắt dự án

| Mục | Nội dung |
|---|---|
| Là gì | Website thuyết trình một trang (scrollytelling) cho bài Lịch sử lớp 10 về bốn phát minh của Trung Hoa cổ đại |
| Người xem | Thầy cô và cả lớp, xem qua **máy chiếu** nối với laptop khá mạnh của nhóm; các nhóm khác mở trên **điện thoại** để trả lời câu đố |
| Việc chính | Giúp 5 bạn thuyết trình theo thứ tự, kể chuyện mạnh mẽ, đồng thời đáp ứng rubric: giới thiệu, ý nghĩa & ảnh hưởng, nguồn & phản tư AI, câu hỏi tương tác |
| Cảm xúc | **Hùng tráng, điện ảnh như trailer phim cổ trang** — nhưng trên **nền giấy sáng** |
| Thứ đáng nhớ nhất | **Một con rồng nét mực tự vẽ dần theo thanh cuộn**, dẫn đường suốt trang, được "điểm mắt" ở cảnh cuối |

Mạch truyện: [Mở cuộn] → Trang 1 Mở đầu (Tử Cấm Thành) → ĐẠI TUA NGƯỢC 2026 → Xuân Thu → thời gian chạy tiến: Giấy 105 → In 868 → Thuốc súng 1044 → La bàn 1088 → TUA NHANH 1088 → 2026 → Trang 6 Hội tụ & hiện đại → khép lại. Chỉ có **một** lần tua ngược.

## 2. Stack
Vite + React + TypeScript, deploy Vercel · GSAP + ScrollTrigger (`@gsap/react`) · Lenis (đồng bộ với ScrollTrigger qua `gsap.ticker`) · Howler.js · CSS viết tay với biến (không thư viện UI) · Three.js chỉ cho hero.

## 3. Hệ màu
`--giay #EFE6D2` · `--giay-sang #F7F1E3` · `--giay-cu #E2D3B2` · `--muc #1F2326` · `--muc-nhat #4A4F52` · `--son #B23A2B` · `--tuong-cung #8E2A22` · `--vang-la #B8903A` · `--vang-sang #D9B86A`.
Tỉ lệ: giấy 80% · mực 14% · đỏ 4% · vàng 2%. `--son` chỉ cho con dấu, bộ đếm năm, năm hạ cánh, nút chính, đáp án sai, nét gạch lỗi AI. `--tuong-cung` chỉ ở 3 khối lớn: chuyển vào đại tua ngược, câu đố, cảnh khép lại. Vàng không bao giờ làm màu chữ nội dung.

## 4. Chữ
Noto Serif Display 700–900 (tiêu đề, năm) · Be Vietnam Pro 400/500/600 (nội dung) · Noto Serif TC 700–900 (chữ Hán phồn thể).
`--fs-hero clamp(64px,11vw,200px)` · `--fs-han-khong-lo clamp(160px,38vh,420px)` · `--fs-year clamp(48px,8vw,128px)` · `--fs-h2 clamp(40px,5vw,72px)` · `--fs-h3 clamp(26px,2.6vw,36px)` · `--fs-body clamp(18px,1.35vw,22px)` (không bao giờ dưới 18px) · `--fs-small clamp(15px,1vw,17px)`. Dòng tối đa 64ch. Căn trái, trừ hero, trang lật, câu hội tụ, cảnh khép lại.

## 5. Bố cục
Hai loại cảnh: điện ảnh (full-bleed, ghim) và đọc (mỗi khối vừa một màn hình). Lưới 12 cột, lề 6vw; **cột 12 và lề phải dành cho thân rồng**. Đầu chương: chữ Hán khổng lồ tràn mép, tên chương, "Phụ trách", con dấu chồng lên góc. Mobile: một cột, rồng là nét dọc mép trái, cảnh ghim rút ngắn, nút câu đố ≥ 56px.

## 6. Texture và hoa văn
Vân giấy multiply 35–45% · nét phân cách như bút lông · mép giấy xé cho nguồn sơ cấp và nhận xét nhóm · vân mây vàng lá mờ ở góc · con dấu `Seal` 3 cỡ · bo góc mặc định 0 (thẻ lật 4px) · bóng ấm lệch `0 18px 30px -18px rgba(60,40,20,.35)`.

## 7. Con rồng
SVG phủ toàn trang, dưới chữ, trên nền. Đường đi sinh từ `data-dragon="x,y"`, nối bằng Catmull-Rom → Bézier, tính lại khi resize. Vẽ theo cuộn bằng `stroke-dashoffset`. Ba lớp nét: mực 10px, quầng 22px mờ 12%, vàng lá 1.5px lệch 3px. Đầu rồng đi theo đầu nét và xoay theo tiếp tuyến; móng ở 4 chương; điểm mắt ở cảnh cuối. Mobile: nét dọc mép trái. Reduced motion: toàn thân 40%, không đầu.

## 8. Các cảnh
Gate "Mở cuộn" · Hero bay drone Nam → Bắc (Ngọ Môn → Kim Thủy → Thái Hòa Môn → ba điện → nội đình → toàn cảnh) · Trang 1 đọc (cuộn tranh ngang 5 khung 文 道 城 天 明, dải triều đại theo tỉ lệ năm thật với 4 chấm, câu Bacon trong trang sách cổ, chuyển chương sang nền đỏ) · Đại tua ngược (18 trang lật, nhanh dần rồi chậm ở Tần/Chiến Quốc/Xuân Thu, dừng ở thẻ tre, chạy tiến 221 TCN → thế kỷ II TCN → 105, dấu 漢) · Khung chương A–I dùng chung · Tua nhanh 1088 → 2026 · Hội tụ và biến hình · Câu đố nền đỏ (phím 1–4, danh hiệu trong con dấu) · Kết luận 3 thông điệp dưới dấu 紙 火藥 指南 · Minh bạch AI · Nguồn 2 cột · Khép lại điểm mắt rồng · Chân trang 5 thành viên.

## 9–11. Component, chế độ thuyết trình, âm thanh
Xem bản gốc của nhóm. Đã làm: `PrimarySource` chữ Hán dọc; `ProcessPin` ghim, đổi ảnh bằng mặt nạ mực, mỗi bước là một điểm dừng; `SpreadMap`; `Significance` (cột Việt Nam có viền son 3px); `AIReflection` dạng chat, nét bút đỏ tự vẽ; `FlipCards`; `YearCounter`; `Nav` ẩn trong cảnh điện ảnh. Chế độ thuyết trình phím P, điểm dừng `data-stop` và điểm đăng ký trong cảnh ghim, `data-stop-autoplay`. Âm thanh Howler, nhạc nền to/nhỏ theo `data-audio`, thiếu file thì im lặng.

## 12. Giai đoạn
1. Khung chạy được · 2. Điện ảnh (Lenis, hero, đại tua ngược, bộ đếm năm, ProcessPin, rồng) · 3. Cao trào & hoàn thiện (bản đồ, tua nhanh, hội tụ, điểm mắt, âm thanh, Gate, reduced motion, mobile) · 5. Tổng duyệt với máy chiếu thật · 6. Dự phòng.
**Không bao giờ cắt:** đại tua ngược, con rồng, nội dung rubric, câu đố, chế độ thuyết trình.

## 13. Tài nguyên
Xem README → "Tài nguyên nhóm cần thêm". Ảnh bằng chứng lịch sử phải là ảnh thật; ảnh AI ghi "Minh họa tạo bằng AI"; ảnh đại tua ngược là cảnh biểu tượng, không vẽ chân dung chính khách hiện đại.

## 14–16. Chất lượng, điều tránh, nghiệm thu
`lang="vi"`, HTML ngữ nghĩa, reduced motion, focus 2px son lệch 3px, tương phản ≥ 7:1, alt tiếng Việt, WebP lazy, chỉ animate transform/opacity. Tránh: rồng 3D bóng, đèn lồng, chữ vàng trên nền đỏ, gradient vàng, hiệu ứng trượt cho mọi section, card bo góc giống nhau, nhãn viết hoa trên tiêu đề, số "01/02" không phải chuỗi thật, kính mờ, emoji, chữ xám nhạt.
