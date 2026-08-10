// chickTalk.ts
// 小雞台詞庫 —— 依狀態說話，賤萌 + 黑色幽默，幽靈講文言文（附翻譯）
//
// 用法：
//   import { getChickTalk } from "./chickTalk";
//   const line = getChickTalk({ name: petName, hp, streak, alive,
//     loggedToday, justFed, isOver, pokeCount });
//   // line => { text: string, sub?: string }
//   //   text = 主台詞、sub = 翻譯（只有文言文幽靈才有）
//
// 設計原則：
//   1. 依「狀態」分組，組內隨機 → 準確又不重複到膩
//   2. pokeCount（連戳次數）優先權最高 → 戳越多越爆走，這是 demo 彩蛋
//   3. {name} 會被換成小雞名字，讓每隻雞都有個人感
//   4. 結構預留多個性（personality），現在只有一種，之後加不用重寫

// ---- 型別 ----
export type ChickState = {
  name: string;          // 小雞名字（pet_name）
  hp: number;            // 0~100
  streak: number;        // 連續記帳天數
  alive: boolean;        // 死活
  loggedToday: boolean;  // 今天記帳了沒
  justFed?: boolean;     // 剛剛餵食（記帳後短暫 true）
  isOver?: boolean;      // 今天超支
  pokeCount?: number;    // 連續戳幾次
};

export type ChickLine = {
  text: string;   // 主台詞
  sub?: string;   // 翻譯（文言文幽靈才有）
};

// ---- 小工具 ----
function pick(lines: ChickLine[]): ChickLine {
  return lines[Math.floor(Math.random() * lines.length)];
}
// 把 {name} 換成真名
function fill(line: ChickLine, name: string): ChickLine {
  return {
    text: line.text.replaceAll("{name}", name),
    sub: line.sub?.replaceAll("{name}", name),
  };
}

// ============================================================
//  台詞庫
// ============================================================

// 💀 幽靈（已死）——文言文 + 翻譯，陰間黑色幽默
const DEAD: ChickLine[] = [
  { text: "{name}殞於飢寒，魂猶記帳……", sub: "（{name}餓死了，但陰魂還想記帳）" },
  { text: "子非雞，安知雞之飢也？", sub: "（你又不是我，怎麼知道我有多餓）" },
  { text: "魂歸離恨天，皆因主人之惰。", sub: "（我會變這樣都是你懶得記帳）" },
  { text: "生無三日糧，死作一縷煙。", sub: "（活著沒東西吃，死了變成一縷煙）" },
  { text: "問君能有幾多愁？恰似荷包無分文。", sub: "（要問我多難過？就跟你錢包一樣空）" },
  { text: "此雞已矣，然記帳不可廢。", sub: "（雞是沒了，但帳還是要記啊）" },
  { text: "……（飄）", sub: "（懶得說話了，飄走）" },
];

// 💀 幽靈 + 被戳 —— 死了還被戳，最委屈也最好笑
const DEAD_POKED: ChickLine[] = [
  { text: "吾已歸西，君何忍相戳？", sub: "（我都死了，你怎麼還忍心戳我）" },
  { text: "都餓死了……你還戳！！！", sub: "（沒有翻譯，這句就是很氣）" },
  { text: "戳之何益？亡雞不能復記帳。", sub: "（戳有什麼用，死掉的雞不能記帳了）" },
  { text: "陰間亦有戳戳之刑乎……", sub: "（陰間也要被戳的刑罰嗎……）" },
];

// 🍜 吃土模式（超支）——苦中作樂、自嘲、有點可憐又賤
const JUNK: ChickLine[] = [
  { text: "又超支了？本{name}今天吃土配風。" },
  { text: "錢沒了，但氣勢不能沒 (๑•̀ㅂ•́)و✧" },
  { text: "沒關係……我習慣了……（小聲）" },
  { text: "主人的錢包跟我一樣扁扁的呢～" },
  { text: "吃土也是一種修行啦，阿彌陀佛。" },
  { text: "這個月又要靠空氣過活了嗎 (´-ω-`)" },
];

const JUNK_POKED: ChickLine[] = [
  { text: "都吃土了還戳我，你是不是很閒？" },
  { text: "戳戳戳，戳出錢來我就不生氣 (｀ω´)" },
  { text: "別戳了啦，我在省力氣消化土。" },
];

// 😰 快餓死（HP 低，但還活著）
const DYING: ChickLine[] = [
  { text: "頭好暈……給我記一筆嘛……{name}快不行了 (´；ω；`)" },
  { text: "眼前一黑……是帳本嗎……還是……" },
  { text: "求求你，一筆就好，{name}想活。" },
  { text: "我的一生走馬燈裡……全是沒記到的帳……" },
];

const DYING_POKED: ChickLine[] = [
  { text: "別……別戳了……我沒力氣了……" },
  { text: "你戳我不如餵我 (っ˘̩╭╮˘̩)っ" },
  { text: "再戳……{name}真的要升天了喔……" },
];

// 😟 餓了（今天還沒記帳，HP 還好）
const HUNGRY: ChickLine[] = [
  { text: "肚子在叫了啦，主人今天還沒餵{name}喔 (｀・ω・´)" },
  { text: "喂——記帳時間到了，別裝沒看到。" },
  { text: "本{name}的胃在跟你抗議中。" },
  { text: "今天的帳呢？我等很久了耶 (・ั﹏・ั)" },
];

const HUNGRY_POKED: ChickLine[] = [
  { text: "戳我幹嘛，餵我啦 (◞‸◟)" },
  { text: "手指有空戳我，怎麼沒空記帳？" },
  { text: "再戳我就……就繼續餓給你看！" },
];

// 🎉 剛餵食（記帳完瞬間）
const JUST_FED: ChickLine[] = [
  { text: "好好吃——！謝謝主人 (๑>ᴗ<๑)" },
  { text: "元氣 +100！{name}又活過來啦！" },
  { text: "這一筆記得漂亮，賞你摸摸頭。" },
  { text: "唔姆唔姆……幸福就是有帳可記 ♡" },
];

// 😊 健康（有記帳、狀態好）—— 賤萌戲精
const NORMAL: ChickLine[] = [
  { text: "本{name}今天超乖，你要誇我 (￣▽￣)ノ" },
  { text: "我們是最強搭檔，沒有之一。" },
  { text: "記帳一時爽，一直記帳一直爽～" },
  { text: "看什麼看，沒看過這麼可愛的雞喔 (･ㅂ･)و" },
  { text: "主人今天也有好好理財，{name}很欣慰。" },
  { text: "偷偷說……我覺得你比昨天更會存錢了。" },
];

const NORMAL_POKED: ChickLine[] = [
  { text: "欸～被你戳到了啦 (⁄ ⁄•⁄ω⁄•⁄ ⁄)" },
  { text: "再戳我就要收費囉，一下一塊。" },
  { text: "別戳了別戳了，人家會害羞。" },
  { text: "你很煩耶（傲嬌）……好啦再戳一下。" },
  { text: "戳夠了沒？本{name}是有尊嚴的。" },
];

// 👑 高 streak 里程碑（連續記帳很多天）
const STREAK_MILESTONE: ChickLine[] = [
  { text: "我們已經一起 {streak} 天了耶，好感動 (っ˘̩╭╮˘̩)っ" },
  { text: "連續 {streak} 天！本{name}要頒獎給你。" },
  { text: "{streak} 天不間斷，這就是紀律的力量 ✧" },
];

// ============================================================
//  主函式：依狀態選台詞
// ============================================================
export function getChickTalk(s: ChickState): ChickLine {
  const poked = (s.pokeCount ?? 0) >= 2; // 連戳 2 次以上算「被戳煩了」

  // ---- 1. 死掉（優先權最高，死了什麼都別談）----
  if (!s.alive) {
    return fill(pick(poked ? DEAD_POKED : DEAD), s.name);
  }

  // ---- 2. 被連戳（活著時，戳越多越有反應）----
  if (poked) {
    if (s.isOver) return fill(pick(JUNK_POKED), s.name);
    if (s.hp <= 34) return fill(pick(DYING_POKED), s.name);
    if (!s.loggedToday) return fill(pick(HUNGRY_POKED), s.name);
    return fill(pick(NORMAL_POKED), s.name);
  }

  // ---- 3. 剛餵食（記帳後短暫的開心）----
  if (s.justFed) {
    // 順便慶祝里程碑
    if (s.streak > 0 && [3, 7, 14, 30, 60, 100].includes(s.streak)) {
      const line = pick(STREAK_MILESTONE);
      return fill({ ...line, text: line.text.replaceAll("{streak}", String(s.streak)) }, s.name);
    }
    return fill(pick(JUST_FED), s.name);
  }

  // ---- 4. 超支（吃土模式）----
  if (s.isOver) {
    return fill(pick(JUNK), s.name);
  }

  // ---- 5. 快餓死 ----
  if (s.hp <= 34) {
    return fill(pick(DYING), s.name);
  }

  // ---- 6. 餓了（今天沒記帳）----
  if (!s.loggedToday) {
    return fill(pick(HUNGRY), s.name);
  }

  // ---- 7. 健康 ----
  return fill(pick(NORMAL), s.name);
}