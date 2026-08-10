// {
//     "category": [
//         {
//             "category_name":"麵類",
//             "sub_category":[
//                 {
//                     "sub_category_name":"牛肉麵"
//                 },
//                 {
//                     "sub_category_name":"餛飩麵"
//                 }
//             ]
//         }
//     ]
// }
import express from "express";
import { prisma } from "../../../lib/prisma.js";

const router = express.Router();

const getSubCategoryData = async () => {
	const categories = await prisma.category.findMany({
		include: {
			sub_category: {
				select: {
					id: true,
					name: true,
				},
				orderBy: {
					id: "asc",
				},
			},
		},
		orderBy: {
			id: "asc",
		},
	});

	return {
		category: categories.map((category) => ({
			category_name: category.name,

			sub_category: category.sub_category.map((sub) => ({
				id: Number(sub.id),
				sub_category_name: sub.name,
			})),
		})),
	};
};

router.get("/categories", async (req, res) => {
	const sub_categories = await getSubCategoryData(req);
	res.json(sub_categories);
	res.locals.pageName = "articles-categories";
});

export default router;
