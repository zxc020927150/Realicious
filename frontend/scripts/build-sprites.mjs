/**
 * 把散裝的 PNG frame 拼成 sprite sheet。
 *
 *   pnpm add -D sharp
 *   node scripts/build-sprites.mjs
 *
 * ---- 你要準備的資料夾 ----
 *
 *   sprites/
 *     chick/
 *       idle_0.png  idle_1.png  idle_2.png  idle_3.png
 *       happy_0.png ...
 *       hungry_0.png ...
 *       junk_0.png ...
 *       dead_0.png ...
 *     bow/
 *       idle_0.png ...
 *     scarf/
 *     cap/
 *     crown/
 *
 * 每張都是 CELL×CELL 的透明背景 PNG。用 CSP、Photoshop、
 * 小畫家、Aseprite 都行 —— 腳本不在乎。
 *
 * ---- 輸出 ----
 *
 *   public/pixel/chick.png   (4×5 網格)
 *   public/pixel/bow.png
 *   ...
 *
 * ---- 偷懶模式 ----
 *
 * 某個狀態還沒畫？整組檔案不放就好，腳本會自動拿 idle 頂著，
 * 並且提醒你還缺什麼。你可以先只畫 idle 就開始跑。
 * ---- 自動清理 ----
 *
 *   node scripts/build-sprites.mjs --fix
 *
 * 會就地修好 sprites/ 底下的原始檔：
 *   ‧ 半透明像素 → alpha 一律吸附成 0 或 255
 *   ‧ 色盤外的顏色 → 吸附到同一個狀態第 0 格的最近色
 * 修改前會先備份成 .bak。
 *
 * 這是保險，不是解法。真正的解法是去 CSP 把「選擇範圍」和
 * 「自由變形」的消除鋸齒關掉 —— 不然每畫一格就要清一次。
 *
 * ---- 補格 ----
 *
 * 動作只畫了 2 格（例如呼吸的一吸一吐）？剩下的自動「循環」補滿：
 *   idle_0, idle_1  →  0, 1, 0, 1
 * 不是重複最後一格（那會變成「吸一下、憋住」）。
 *
 * 因為表格是 4 格，動作請畫 1、2 或 4 格。畫 3 格會被補成
 * 0,1,2,0，循環時第 0 格會連放兩次。
 */

import sharp from "sharp";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const CELL = 64; // 一格幾像素。要跟 PixelSpriteSheet.tsx 的 CELL 一致
const FRAMES = 4; // 每個狀態幾格
const STATES = ["idle", "happy", "hungry", "junk", "dead", "held", "surprised"]; // 順序 = 表格的列，別動
const PARTS = ["chick", "bow", "scarf", "cap", "crown"];

const SRC = "sprites";
const OUT = "public/pixel";

const FIX = process.argv.includes("--fix");

const W = CELL * FRAMES;
const H = CELL * STATES.length;

const blank = () =>
  sharp({
    create: {
      width: CELL,
      height: CELL,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

async function loadFrames(dir, state) {
  const found = [];
  for (let i = 0; i < FRAMES; i++) {
    const p = path.join(dir, `${state}_${i}.png`);
    if (existsSync(p)) found.push(p);
    else break; // 中間斷掉就不再往後找，剩下的用最後一格補
  }
  return found;
}

/* ---------- 自動清理 ---------- */

const fixed = [];

// 把一張圖的 alpha 吸附成 0/255，並把顏色吸附到參考色盤
async function autofix(file, palette) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let touched = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0 || a === 255) continue;

    touched++;
    data[i + 3] = a >= 128 ? 255 : 0;
    if (data[i + 3] === 0) continue;

    // 顏色也吸附到色盤裡最近的一個
    if (palette && palette.length) {
      let best = null;
      let bestD = Infinity;
      for (const c of palette) {
        const dr = data[i] - c[0];
        const dg = data[i + 1] - c[1];
        const db = data[i + 2] - c[2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (best) {
        data[i] = best[0];
        data[i + 1] = best[1];
        data[i + 2] = best[2];
      }
    }
  }

  if (touched === 0) return 0;

  await copyFile(file, file + ".bak");
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(file);

  fixed.push(`${file}  修好 ${touched} 個半透明像素（原檔備份成 .bak）`);
  return touched;
}

// 讀出一張圖的色盤（只收 alpha=255 的）
async function paletteOf(file) {
  const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Set();
  const out = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([data[i], data[i + 1], data[i + 2]]);
  }
  return out;
}

/* ---------- 檢查器：單張看都正常的錯誤，靠這個抓 ---------- */

const problems = []; // 會擋 build：半透明像素、尺寸錯、腳底沒對齊
const warnings = []; // 只提醒：內插殘渣色（肉眼看不出來）
const palettes = new Map(); // "chick/idle" → [第0格色盤, 第1格色盤, ...]

const hex = (c) =>
  [c[0], c[1], c[2]].map((v) => v.toString(16).padStart(2, "0").toUpperCase()).join("");

async function lint(file, part, state, idx) {
  const img = sharp(file);
  const meta = await img.metadata();
  const tag = `${part}/${state}_${idx}.png`;

  if (meta.width !== CELL || meta.height !== CELL) {
    problems.push(`${tag}  尺寸是 ${meta.width}×${meta.height}，應該是 ${CELL}×${CELL}`);
    return null;
  }

  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let soft = 0; // 半透明像素（不是 0 也不是 255）
  const colors = new Set();
  let minY = CELL, maxY = -1, minX = CELL, maxX = -1;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    if (a !== 255) soft++;
    const px = i / 4;
    const x = px % CELL;
    const y = (px / CELL) | 0;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
  }

  if (soft > 0) {
    problems.push(
      `${tag}  有 ${soft} 個半透明像素 —— 筆刷/橡皮擦的不透明度不是 100%，或抗鋸齒沒關`,
    );
  }

  return { colors: colors.size, bottom: maxY, top: minY, left: minX, right: maxX };
}

/* ---------- 拼一張表 ---------- */

async function buildPart(part) {
  const dir = path.join(SRC, part);
  if (!existsSync(dir)) {
    console.log(`  ⨯ 找不到 ${dir}/，跳過 ${part}`);
    // chick 是必要的，沒有它整個 app 就沒有小雞
    if (part === "chick") problems.push(`找不到 ${dir}/ —— 小雞的圖一張都沒有`);
    return;
  }

  const composites = [];
  const notes = [];
  const stats = [];

  // ★ --fix 要在「讀 idle 當備胎」之前先跑一輪，把所有原始檔清乾淨。
  //   不然單張配件（只有 idle_0）永遠不會被 fix —— 那正是圍巾的 bug。
  if (FIX) {
    for (const state of STATES) {
      const fs = await loadFrames(dir, state);
      // 每個狀態各自用自己第 0 格的色盤當基準
      const pal = fs.length ? await paletteOf(fs[0]) : null;
      for (let i = 0; i < fs.length; i++) {
        await autofix(fs[i], i === 0 ? null : pal);
      }
    }
  }

  // 先把 idle 讀出來當備胎
  const idleFrames = await loadFrames(dir, "idle");
  if (idleFrames.length === 0 && part === "chick") {
    problems.push(`${part}/ 裡連 idle_0.png 都沒有 —— 至少要有這一張`);
    return;
  }

  // 配件（bow/scarf/cap/crown）在這些狀態「不出現」。
  //   dead      —— 幽靈不戴東西
  //   held      —— 被拎起來，帽子王冠會掉（而且 held 是橫躺，位置全不同）
  //   surprised —— 幽靈驚訝，同樣不戴
  // chick 本體不受這個限制（它每個狀態都要有圖）。
  const ACCESSORY_SKIP = new Set(["dead", "held", "surprised"]);

  for (let row = 0; row < STATES.length; row++) {
    const state = STATES[row];
    let frames = await loadFrames(dir, state);

    // 配件遇到「不該出現」的狀態 → 整列留空，不要用 idle 去頂
    if (part !== "chick" && ACCESSORY_SKIP.has(state)) {
      frames = [];
      notes.push(`${state} → 配件不出現（留空）`);
    } else if (frames.length === 0) {
      if (idleFrames.length > 0) {
        frames = idleFrames;
        notes.push(`${state} → 先用 idle 頂著`);
      } else {
        notes.push(`${state} → 空白`);
      }
    }

    if (frames.length === 3) {
      notes.push(`${state} → 只有 3 格，會補成 0,1,2,0（第 0 格會連放兩次）`);
    }

    // 檢查原始檔（只檢查真的存在的那幾張）
    const key = `${part}/${state}`;
    palettes.set(key, []);
    for (let i = 0; i < frames.length; i++) {
      const info = await lint(frames[i], part, state, i);
      if (info) {
        stats.push({ tag: `${key}_${i}`, ...info });
        palettes.get(key).push({ colors: await paletteOf(frames[i]) });
      }
    }

    // 配件只給 1 張 → 自動生成呼吸的第 2 格（往上 1px），跟身體呼吸同步。
    // 這樣你每個配件只要畫 1 張，不用畫 idle_0 + idle_1 兩張。
    // （chick 本體不套這規則 —— 它的動作是你精心畫的，不是機械位移。）
    const autoBreathe = part !== "chick" && frames.length === 1;

    for (let col = 0; col < FRAMES; col++) {
      let src = frames.length ? frames[col % frames.length] : null;
      let buf;

      if (!src) {
        buf = await blank();
      } else if (autoBreathe) {
        // 奇數格往上 1px（呼吸的吸氣）：砍掉最上面 1 列，底部補 1 列透明。
        // 這樣總高度維持 CELL，內容整體上移 1px。
        const resized = await sharp(src)
          .resize(CELL, CELL, { kernel: "nearest", fit: "contain" })
          .png()
          .toBuffer();
        if (col % 2 === 1) {
          buf = await sharp(resized)
            .extract({ left: 0, top: 1, width: CELL, height: CELL - 1 }) // 砍掉頂端 1 列
            .extend({ top: 0, bottom: 1, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } }) // 底部補回
            .png()
            .toBuffer();
        } else {
          buf = resized;
        }
      } else {
        buf = await sharp(src)
          .resize(CELL, CELL, { kernel: "nearest", fit: "contain" })
          .png()
          .toBuffer();
      }

      composites.push({ input: buf, left: col * CELL, top: row * CELL });
    }
  }

  const sheet = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true }) // palette: true → 索引色，檔案更小、更「像素」
    .toBuffer();

  await writeFile(path.join(OUT, `${part}.png`), sheet);
  console.log(`  ✓ ${part}.png  (${W}×${H})`);
  notes.forEach((n) => console.log(`      ↳ ${n}`));
  return stats;
}

const allStats = [];
const frameIndex = new Map(); // state -> [file...]，只收 chick，給色盤漂移檢查用

await mkdir(OUT, { recursive: true });
console.log(`拼 sprite sheet（一格 ${CELL}px，${FRAMES} 格 × ${STATES.length} 列）\n`);
for (const part of PARTS) {
  const st = await buildPart(part);
  if (st) allStats.push(...st);
}

/* ---------- 跨檔案的一致性檢查 ---------- */

// 腳底：站在地上的狀態都必須踩在同一條線上，不然切換時小雞會憑空跳一下。
// dead 例外 —— 幽靈沒有腳，本來就該飄著。
const chickStats = allStats.filter(
  (s) => s.tag.startsWith("chick/") && !s.tag.startsWith("chick/dead"),
);
if (chickStats.length > 1) {
  const bottoms = new Map();
  for (const s of chickStats) {
    if (!bottoms.has(s.bottom)) bottoms.set(s.bottom, []);
    bottoms.get(s.bottom).push(s.tag);
  }
  if (bottoms.size > 1) {
    problems.push(`腳底沒對齊 —— 切換狀態時小雞會憑空跳動：`);
    for (const [y, tags] of [...bottoms].sort((a, b) => b[1].length - a[1].length)) {
      problems.push(`    y=${y}  ${tags.join(", ")}`);
    }
  }
}

/* 色盤漂移：同一個狀態的第 1 格，如果出現「跟第 0 格某個顏色極度接近」
   的新顏色，那不是你畫的 —— 那是內插算出來的殘渣。

   關鍵是看「色距」，不是看「有沒有新顏色」：
     #CAB198 距離 #C9B098 只有 1.4  → 殘渣
     #FFFFFF 距離最近色 200 以上     → 你畫的牙齒，別誤報
*/
const NEAR = 12; // 色距小於這個 = 可疑的內插殘渣

for (const [key, pals] of palettes) {
  if (pals.length < 2) continue;
  const [base, ...rest] = pals;
  rest.forEach((p, i) => {
    const suspects = [];
    for (const c of p.colors) {
      if (base.colors.some((b) => b[0] === c[0] && b[1] === c[1] && b[2] === c[2])) continue;
      let nearest = null;
      let best = Infinity;
      for (const b of base.colors) {
        const d = Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]);
        if (d < best) {
          best = d;
          nearest = b;
        }
      }
      if (best < NEAR) {
        suspects.push(
          `#${hex(c)} 幾乎等於 #${hex(nearest)}（色距 ${best.toFixed(1)}）`,
        );
      }
    }
    if (suspects.length) {
      // 提醒，不是錯誤。色距這麼小，肉眼看不出來，不該擋掉 build。
      warnings.push(
        `${key}_${i + 1}  有 ${suspects.length} 個內插殘渣色 —— 消除鋸齒沒關乾淨：`,
      );
      suspects.forEach((t) => warnings.push(`    ${t}`));
    }
  });
}

console.log(`\n完成 → ${OUT}/`);

if (fixed.length) {
  console.log(`\n🔧 --fix 清理了 ${fixed.length} 個檔案：\n`);
  fixed.forEach((f) => console.log("  " + f));
}

if (warnings.length) {
  console.log("\n💡 提醒（不影響畫面，不擋 build）：\n");
  warnings.forEach((w) => console.log("  " + w));
}

if (problems.length) {
  console.log(`\n✗ 有 ${problems.length} 個必須修的問題：\n`);
  if (!FIX) console.log("  （加上 --fix 可以自動清掉半透明像素）\n");
  problems.forEach((p) => console.log("  " + p));
  console.log("");
  process.exitCode = 1;
} else if (!warnings.length) {
  console.log("\n✓ 檢查通過：沒有半透明像素、腳底對齊、色盤穩定");
} else {
  console.log("\n✓ 沒有致命問題");
}
