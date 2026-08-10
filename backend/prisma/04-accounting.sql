INSERT INTO `user_budget` (`user_id`, `daily_budget`, `is_poor_mode_enabled`) VALUES
(1, 500, 'N'),
(2, 300, 'Y'),
(3, 800, 'N'),
(4, 250, 'Y'),
(5, 600, 'N');
--cut
INSERT INTO `user_pet` (`user_id`, `pet_name`, `equipped_head`, `equipped_neck`) VALUES
(1, '小王', 'cap',   'scarf'),  -- 頭戴鴨舌帽 + 脖子圍巾（示範疊戴）
(2, '米粒', 'bow',   NULL),     -- 只戴蝴蝶結
(3, '布丁', 'crown', NULL),     -- 只戴王冠
(4, '呆呆', NULL,    'scarf'),  -- 只戴圍巾
(5, '嘟嘟', NULL,    NULL);     -- 什麼都沒戴（對照組）
--cut
INSERT INTO `diet_detail` (`user_id`, `type`, `consume_date`, `category`, `amount`, `user_remark`) VALUES
(1, 'S', CURDATE() - INTERVAL 19 DAY, '餐飲',      120, '雞腿便當'),
(1, 'S', CURDATE() - INTERVAL 19 DAY, '飲品',       60, '大冰奶'),
(1, 'S', CURDATE() - INTERVAL 18 DAY, '餐飲',       95, '滷肉飯'),
(1, 'S', CURDATE() - INTERVAL 18 DAY, '交通',       50, '捷運'),
(1, 'S', CURDATE() - INTERVAL 17 DAY, '餐飲',      150, '牛肉麵'),
(1, 'S', CURDATE() - INTERVAL 16 DAY, '餐飲',       65, '早餐店'),
(1, 'S', CURDATE() - INTERVAL 16 DAY, '娛樂',      320, '電影票'),
(1, 'S', CURDATE() - INTERVAL 15 DAY, '餐飲',      110, '便當'),
(1, 'I', CURDATE() - INTERVAL 15 DAY, '薪資',    32000, '七月薪水'),
(1, 'S', CURDATE() - INTERVAL 14 DAY, '餐飲',      180, '火鍋'),
(1, 'S', CURDATE() - INTERVAL 14 DAY, '飲品',       55, '四季春'),
(1, 'S', CURDATE() - INTERVAL 13 DAY, '餐飲',       90, '水餃'),
(1, 'S', CURDATE() - INTERVAL 13 DAY, '學習',      350, '原子習慣'),
(1, 'S', CURDATE() - INTERVAL 12 DAY, '服飾',      680, '買鞋（超支了…）'),
(1, 'S', CURDATE() - INTERVAL 12 DAY, '餐飲',      100, '便當'),
(1, 'S', CURDATE() - INTERVAL 11 DAY, '餐飲',       75, '三明治'),
(1, 'S', CURDATE() - INTERVAL 10 DAY, '餐飲',      130, '拉麵'),
(1, 'S', CURDATE() - INTERVAL 10 DAY, '交通',       30, '公車'),
(1, 'S', CURDATE() - INTERVAL 9 DAY, '餐飲',      200, '吃吃'),
(1, 'I', CURDATE() - INTERVAL 9 DAY, '其他收入', 5000, '專案獎金'),
(1, 'S', CURDATE() - INTERVAL 8 DAY, '餐飲',       85, '早午餐'),
(1, 'S', CURDATE() - INTERVAL 7 DAY, '餐飲',      160, '燒肉飯'),
(1, 'S', CURDATE() - INTERVAL 7 DAY, '飲品',       70, '手搖'),
(1, 'S', CURDATE() - INTERVAL 6 DAY, '餐飲',      120, '午餐');
