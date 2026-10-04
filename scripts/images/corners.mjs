/*
 * The four images that emerge from the screen corners on each page of the
 * Great Rewind: one set per event, no image used twice. Run once to rewrite
 * the corner-* slots in slots.json (existing downloads are renamed, not
 * fetched again):  node scripts/images/corners.mjs
 */
import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
const HERE = fileURLToPath(new URL(".", import.meta.url));
const IMG = `${HERE}../../public/img`;

export const CORNERS = {
  2026: [
    ["CR400AF-A Fuxing EMU.jpg", "Tàu cao tốc Phục Hưng CR400AF"],
    ["Shanghai skyline waterfront pudong 5166168 69 70.jpg", "Phố Đông, Thượng Hải"],
    ["Beijing Daxing International Airport Terminal 20191005.jpg", "Nhà ga sân bay Đại Hưng, Bắc Kinh"],
    ["Hong Kong–Zhuhai–Macau Bridge 01.jpg", "Cầu Hồng Kông – Chu Hải – Ma Cao"],
  ],
  1949: [
    ["Chinese PLA occupied Lanzhou Zhongshan bridge on August 26th, 1949.jpg", "Quân Giải phóng qua cầu Trung Sơn, Lan Châu, 8/1949"],
    ["Communist Offensives April - October 1949.PNG", "Bản đồ các cuộc tiến công tháng 4–10/1949"],
    ["Monument to the People's Heroes in Beijing, 18 April 2011.jpg", "Bia Kỷ niệm Anh hùng Nhân dân, Bắc Kinh"],
    ["PLA Troops entered to Nanjing Road, Shanghai.jpg", "Quân Giải phóng trên đường Nam Kinh, Thượng Hải"],
  ],
  1937: [
    ["Marco Polo Bridge air view.PNG", "Cầu Lư Câu nhìn từ trên cao", "corner-canhien-4"],
    ["Ji16, 4-1, Lugou Bridge Incident, 1952.jpg", "Tem kỷ niệm sự biến Lư Câu Kiều (1952)"],
    ["Sihang warehouse under fire.jpg", "Kho Tứ Hành trúng đạn trong trận Thượng Hải, 1937"],
    ["Bund in 1930 - Shanghai Urban Planning Exhibition Center.JPG", "Bến Thượng Hải khoảng năm 1930", "corner-canhien-3"],
  ],
  1911: [
    ["Hubei Military Government.jpg", "Trụ sở Quân chính phủ Hồ Bắc sau khởi nghĩa Vũ Xương, 1911", "corner-canhien-1"],
    ["革命军自武昌渡江作战.jpg", "Quân cách mạng vượt sông ở Vũ Xương, 1911", "corner-canhien-2"],
    ["Revolutionary army headquarters at Hanyang.jpg", "Sở chỉ huy quân cách mạng ở Hán Dương"],
    ["Weapons are on the exhibition in the Museum of Xinhai Revolution Figures.jpg", "Vũ khí thời Cách mạng Tân Hợi (bảo tàng)"],
  ],
  1851: [
    ["Young Heavenly King's Jade Seal (10151790784).jpg", "Ấn ngọc của Ấu Thiên Vương, Thái Bình Thiên Quốc"],
    ["Vault Protector Coin of Taiping Kingdom.jpg", "Đồng tiền của Thái Bình Thiên Quốc"],
    ["Model-of-palace-of-heavenly-kingdom.JPG", "Mô hình Thiên Vương phủ ở Nam Kinh"],
    ["TaiPingRevolutionSeal.png", "Ấn của Thái Bình Thiên Quốc"],
  ],
  1840: [
    ["The Signing of the Treaty of Nanking (Key).jpg", "Ký Điều ước Nam Kinh, 1842", "corner-thanh-3"],
    ["Qing Opium Pipe.jpg", "Tẩu hút thuốc phiện thời Thanh"],
    ["Statue of Lin Zexu in Macau.JPG", "Tượng Lâm Tắc Từ ở Ma Cao"],
    ["Opium War Museum.jpg", "Bảo tàng Chiến tranh Nha phiến"],
  ],
  1644: [
    ["Portrait of the Qianlong Emperor in Court Dress.jpg", "Chân dung hoàng đế Càn Long trong lễ phục", "corner-thanh-1"],
    ["Kangxi-Verbotene-Stadt1.jpg", "Tranh cung đình thời Khang Hy", "corner-thanh-2"],
    ["Stele of Emperor Chongzhen's death place in Jingshan Park.jpg", "Bia nơi vua Sùng Trinh nhà Minh mất, Cảnh Sơn"],
    ["Imperial parcel-gilt iron helmet, Qing dynasty.jpg", "Mũ trụ sắt mạ vàng thời Thanh"],
  ],
  1351: [
    ["YuanEmperorAlbumKhubilaiPortrait.jpg", "Chân dung Hốt Tất Liệt", "corner-nguyen-1"],
    ["Yuan Underglaze Blue Jingdezhen Porcelain Vase.jpg", "Bình sứ hoa lam Cảnh Đức Trấn thời Nguyên", "corner-nguyen-2"],
    ["Longfeng Tongbao (龍鳳通寶) - Red Turban Rebellion - Liuliang Yu and Hong Yu 01.png", "Tiền Long Phượng thông bảo của quân Khăn Đỏ"],
    ["Red Turban regional powers 1350–1360.png", "Các thế lực Khăn Đỏ, 1350–1360"],
  ],
  1279: [
    ["Chinese cargo ships, Song Dynasty.jpg", "Thuyền buôn thời Tống", "corner-tong-3"],
    ["The book of Ser Marco Polo - the Venetian concerning the kingdoms and marvels of the East (1903) (14582982968).jpg", "Trang sách Marco Polo kể về phương Đông", "corner-nguyen-4"],
    ["八思巴文鐡牌-Safe Conduct Pass (Paiza) with Inscription in Phakpa Script MET DT7051.jpg", "Thẻ bài thông hành chữ Bát Tư Ba thời Nguyên"],
    ["Southern Song Ge Ware Vase.jpg", "Bình sứ lò Ca thời Nam Tống", "corner-tong-4"],
  ],
  960: [
    ["Song Taizu (cropped).jpg", "Chân dung Tống Thái Tổ Triệu Khuông Dẫn"],
    ["Emperor Huizong - Five-colored parakeet on a blossoming apricot tree - Google Art Project.jpg", "Tranh vẹt ngũ sắc của Tống Huy Tông", "corner-tong-1"],
    ["Ru Ware Celadon, Northern Song (27203011619).jpg", "Sứ men xanh lò Nhữ thời Bắc Tống", "corner-tong-2"],
    ["20241025 Jun Porcelain Bowl, Song Dynasty.jpg", "Bát sứ lò Quân thời Tống"],
  ],
  907: [
    ["The Five Dynasties II Period of Later T'ang 923-936 AD.jpg", "Bản đồ thời Ngũ Đại", "corner-duong-4"],
    ["Five Dynasties Porcelain 01.jpg", "Đồ sứ thời Ngũ Đại"],
    ["Gu Hongzhong's Night Revels, Detail 6.jpg", "Chi tiết tranh Hàn Hy Tái dạ yến đồ (bản vẽ lại thời Tống)"],
    ["Tang or Five Dynasties Porcelain 11.jpg", "Đồ sứ thời Đường – Ngũ Đại"],
  ],
  755: [
    ["Tang Sancai Horse 1.jpg", "Ngựa gốm tam thái thời Đường", "corner-duong-1"],
    ["TangTaizong- cropped.jpg", "Chân dung Đường Thái Tông", "corner-duong-2"],
    ["Tang Mural from Dunhuang (9923168493).jpg", "Bích họa Đôn Hoàng thời Đường", "corner-duong-3"],
    ["Tang Sancai Camel & Rider.jpg", "Lạc đà và người cưỡi, gốm tam thái thời Đường"],
  ],
  208: [
    ["Three Kingdoms Wei Bronze Crossbow Trigger Mechanism (9930025225).jpg", "Lẫy nỏ bằng đồng nước Ngụy thời Tam Quốc"],
    ["Battle of Red Cliffs Peking Opera 1.jpg", "Vở Kinh kịch về trận Xích Bích"],
    ["Statue of Three Kingdoms Hero Guan Yu.jpg", "Tượng Quan Vũ"],
    ["Three Kingdoms Repeating Crossbow Model (9884065543).jpg", "Mô hình nỏ liên châu thời Tam Quốc"],
  ],
  184: [
    ["Eastern Han Bronze Galloping Horse (10094802964).jpg", "Ngựa đồng phi thời Đông Hán", "corner-han-1"],
    ["Eastern Han Jade Burial Suit - a.jpg", "Áo liệm ngọc thời Đông Hán", "corner-han-2"],
    ["Han Pottery Tower Collection.jpg", "Lầu gốm thời Hán", "corner-han-4"],
    ["Eastern Han Pottery Buqu Soldier (9832240013).jpg", "Tượng gốm lính thời Đông Hán"],
  ],
  "206tcn": [
    ["T-shaped Painting on Silk - Google Art Project.jpg", "Tranh lụa Mã Vương Đôi thời Tây Hán", "corner-han-3"],
    ["Liu Bang (Emperor Gaozu of Han).png", "Chân dung Lưu Bang (tranh đời sau)"],
    ["Xiang Yu.jpg", "Chân dung Hạng Vũ (tranh đời sau)"],
    ["Mawangdui Lacquer 1.jpg", "Đồ sơn mài Mã Vương Đôi thời Tây Hán"],
  ],
  "221tcn": [
    ["Portrait of Qin Shi Huang.jpg", "Chân dung Tần Thủy Hoàng (tranh đời sau)", "corner-tan-1"],
    ["027 S-83 Qin Ban Liang, 221-208, 30mm.jpg", "Đồng tiền Bán lạng thời Tần", "corner-tan-2"],
    ["2009 Qin Terracotta General.jpg", "Tượng tướng quân đất nung thời Tần", "corner-tan-3"],
    ["2011 Qin Shihuang Bronze Chariot Horses.jpg", "Xe ngựa đồng lăng Tần Thủy Hoàng"],
  ],
  chienquoc: [
    ["Warring States Bronze Ding 1.jpg", "Đỉnh đồng thời Chiến Quốc", "corner-chienquoc-1"],
    ["Eastern Zhou Spade Coins.jpg", "Tiền hình cái thuổng thời Đông Chu", "corner-chienquoc-4"],
    ["Warring States Bronze Mirror.jpg", "Gương đồng thời Chiến Quốc"],
    ["Warring States Lacquer Cup (9830971685).jpg", "Chén sơn mài thời Chiến Quốc"],
  ],
  xuanthu: [
    ["Sword of Goujian, 2019-06-15 02.jpg", "Kiếm Việt vương Câu Tiễn thời Xuân Thu", "corner-chienquoc-2"],
    ["Confucius Tang Dynasty.jpg", "Chân dung Khổng Tử (tranh thời Đường)", "corner-chienquoc-3"],
    ["Spring & Autumn Bronze Hu 01e.jpg", "Bình đồng thời Xuân Thu"],
    ["Zhang Lu-Laozi Riding an Ox (cropped).jpg", "Lão Tử cưỡi trâu (tranh Trương Lộ, thời Minh)"],
  ],
  fqin: [
    ["Qin Bamboo Slips (10160678273).jpg", "Thẻ tre thời Tần"],
    ["Edict bronze standard weight Qin dynasty.jpg", "Quả cân đồng khắc chiếu thống nhất đo lường của nhà Tần"],
    ["The Making of Bamboo Slips and Writing (10160906513).jpg", "Cách làm thẻ tre và viết chữ (trưng bày)"],
    ["Banliang Coins of Qin and Han Dynasties 03.jpg", "Tiền Bán lạng thời Tần – Hán", "corner-tan-4"],
  ],
  fxihan: [
    ["Western Han Bronze Lamp in Shape of Bird.jpg", "Đèn đồng hình chim thời Tây Hán"],
    ["Western Han Jade Bi Disc.jpg", "Ngọc bích thời Tây Hán"],
    ["Mawangdui Lacquer dish 1.jpg", "Đĩa sơn mài Mã Vương Đôi"],
    ["20250118 Changxin Palace Lamp 01.jpg", "Đèn Trường Tín cung thời Tây Hán"],
  ],
  f105: [
    ["Eastern Han Bronze Mythical Animal Candleholder.jpg", "Chân nến bằng đồng hình thú thời Đông Hán"],
    ["Eastern Han Coiling Dragon Ink Stone.jpg", "Nghiên mực hình rồng cuộn thời Đông Hán"],
    ["Eastern Han Bronze Chariot.jpg", "Xe ngựa đồng thời Đông Hán"],
    ["毛筆（居延漢簡）.jpg", "Bút lông thời Hán tìm thấy ở Cư Diên"],
  ],
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slots = JSON.parse(readFileSync(`${HERE}slots.json`, "utf8")).filter(([s]) => !s.startsWith("corner-"));
  const credits = existsSync(`${HERE}credits.json`) ? JSON.parse(readFileSync(`${HERE}credits.json`, "utf8")) : [];
  const byOld = new Map(credits.map((c) => [c.slot, c]));
  for (const [key, list] of Object.entries(CORNERS)) {
    list.forEach(([title, alt, old], i) => {
      const slot = `corner-${key}-${i + 1}`;
      slots.push([slot, title, alt]);
      if (old && existsSync(`${IMG}/${old}.webp`) && !existsSync(`${IMG}/${slot}.webp`)) renameSync(`${IMG}/${old}.webp`, `${IMG}/${slot}.webp`);
      if (old && byOld.has(old)) byOld.get(old).slot = slot;
    });
  }
  writeFileSync(`${HERE}slots.json`, JSON.stringify(slots, null, 1));
  writeFileSync(`${HERE}credits.json`, JSON.stringify(credits.filter((c) => !/^corner-(canhien|thanh|minh|nguyen|tong|duong|han|tan|chienquoc)-/.test(c.slot)), null, 1));
  console.log("slots:", slots.length);
}
