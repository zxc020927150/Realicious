import mysql from "mysql2/promise";

const url = new URL(process.env.DATABASE_URL);
const db = await mysql.createConnection({
	host: url.hostname,
	port: Number(url.port || 3306),
	user: decodeURIComponent(url.username),
	password: decodeURIComponent(url.password),
	database: url.pathname.slice(1),
});

const image =
	'<figure class="image"><img src="http://localhost:3000/article/beefnoodle.jpg" alt="紅燒牛肉麵"></figure>';
const [result] = await db.execute(
	`UPDATE article
	 SET content = JSON_SET(
	   COALESCE(content, JSON_OBJECT()),
	   '$.text',
	   CONCAT('<p>', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(content, '$.text')), ''), '</p>', ?)
	 )
	 WHERE id = 1
	   AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(content, '$.text')), '') NOT LIKE '%beefnoodle.jpg%'`,
	[image],
);
const [rows] = await db.execute(
	"SELECT JSON_UNQUOTE(JSON_EXTRACT(content, '$.text')) AS text FROM article WHERE id = 1",
);

console.log(
	JSON.stringify({
		affectedRows: result.affectedRows,
		imageEmbedded: rows[0]?.text?.includes("beefnoodle.jpg") ?? false,
	}),
);

await db.end();
