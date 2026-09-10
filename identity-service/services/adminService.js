import prisma from '../config/prisma.js';

class AdminService {
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        role: true,
        is_active: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async toggleUserStatus(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    return await prisma.user.update({
      where: { id: userId },
      data: { is_active: !user.is_active }
    });
  }
}

export default new AdminService();
