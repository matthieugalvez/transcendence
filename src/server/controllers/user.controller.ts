import Send from "@utils/response.utils";
import { prisma } from "database";
import { FastifyRequest, FastifyReply } from "fastify";
import { send } from "process";

class UserController {

    static getUser = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId; // Extract userId from the authenticated request

            // Fetch the user data from the database (Prisma in this case)
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    createdAt: true,
                    updatedAt: true,
                    // Add other fields you want to return
                }
            });

            // If the user is not found, return a 404 error
            if (!user) {
                return Send.notFound(res, {}, "User not found");
            }

            // Return the user data in the response
            return Send.success(res, { user });
        } catch (error) {
            console.error("Error fetching user info:", error);
            return Send.error(res, {}, "Internal server error");
        }
    };
}

export default UserController;