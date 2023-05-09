import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../prisma/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method === "POST") {
		const session = await getServerSession(req, res, authOptions);
		if (!session) {
			return res
				.status(401)
				.json({ message: "Please sign in to create a post." });
		}

		const { commentId } = req.body;
		// console.log("postId", postId);
		// Get user from database
		const prismaUser = await prisma.user.findUnique({
			where: { email: session?.user?.email || undefined },
		});

		// Check if user has already liked the post
		const alreadyLiked = await prisma.commentLike.findFirst({
			where: {
				commentId: commentId as string,
				userId: prismaUser?.id as string,
			},
		});

		// Create like
		try {
			if (!alreadyLiked) {
				// Create like if user has not liked the post
				const result = await prisma.commentLike.create({
					data: {
						commentId: commentId as string,
						userId: prismaUser?.id as string,
					},
				});

				return res.status(200).json(result);
			} else {
				// Delete like if user has already liked the post
				const result = await prisma.commentLike.delete({
					where: {
						id: alreadyLiked.id,
					},
				});

				return res.status(201).json(result);
			}
		} catch (err) {
			// console.log(err);
			res
				.status(403)
				.json({ err: "Error has occured while trying to like comment" });
		}
	}
}