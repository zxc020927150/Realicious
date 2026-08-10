import { prisma } from "../lib/prisma.js";
import fs from 'fs';
import path from 'path';

async function main() {
  // 1. 在這裡「按順序」列出所有要執行的 SQL 檔名
  const sqlFiles = [
    '01-users.sql',
    '02-article.sql',
    '03-shop.sql',
    '04-accounting.sql'
  ];

  console.log(`🌱 開始植入 ${sqlFiles.length} 個 SQL 檔案...`);

  // 2. 外層迴圈：逐一處理每個檔案
  for (const fileName of sqlFiles) {
    const sqlPath = path.join(process.cwd(), 'prisma', fileName);
    
    // 防呆：確認檔案存在
    if (!fs.existsSync(sqlPath)) {
      console.warn(`⚠️ 找不到檔案：${fileName}，跳過執行。`);
      continue;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 切割單條指令
    const statements = sqlContent
      .split('--cut')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📄 正在執行 ${fileName}（包含 ${statements.length} 條指令）...`);

    // 內層迴圈：執行該檔案中的 SQL
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }

  console.log('✅ 所有 SQL 資料植入完成！');
}

main()
  .catch((e) => {
    console.error('❌ 執行失敗：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });