import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import type { UserPermissionData } from "@/next-auth"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
    signOut: "/auth/sign-in"
  },
  ...authConfig,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      
      const existingUser = await prisma.user.findUnique({ 
        where: { id: user.id },
        select: { isActive: true }
      });
      
      return existingUser?.isActive === true;
    },
    
    async jwt({ token, trigger }) {
      if (!token.sub) return token;

      // Update lastLoginAt on sign in
      if (trigger === "signIn") {
        await prisma.user.update({
          where: { id: token.sub },
          data: { lastLoginAt: new Date() }
        });
      }

      const userWithDetails = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          permissions: {
            select: {
              id: true,
              permission: true,
              grantedAt: true,
              expiresAt: true,
            }
          }
        },
      });

      if (!userWithDetails) return token;

      // Filter out expired permissions
      const activePermissions = userWithDetails.permissions.filter(permission => {
        if (!permission.expiresAt) return true; // No expiry date means permanent
        return permission.expiresAt > new Date(); // Check if not expired
      });

      const leanPermissions: UserPermissionData[] = activePermissions.map((p) => ({
        id: p.id,
        permission: p.permission,
        grantedAt: p.grantedAt,
        expiresAt: p.expiresAt,
      }));

      // Update token with user data
      token.id = userWithDetails.id;
      token.email = userWithDetails.email;
      token.username = userWithDetails.username;
      token.firstName = userWithDetails.firstName;
      token.lastName = userWithDetails.lastName;
      token.employeeId = userWithDetails.employeeId;
      token.department = userWithDetails.department;
      token.position = userWithDetails.position;
      token.phone = userWithDetails.phone;
      token.isActive = userWithDetails.isActive;
      token.role = userWithDetails.role; // This is the UserRole enum
      token.permissions = leanPermissions;
      token.lastLoginAt = userWithDetails.lastLoginAt;

      return token;
    },
    
    async session({ token, session }) {
      if (token.sub && session.user) {
        // Create a properly typed user object
        const customUser = {
          ...session.user,
          id: token.id as string,
          email: token.email || null,
          username: token.username || "",
          firstName: token.firstName || null,
          lastName: token.lastName || null,
          employeeId: token.employeeId || null,
          department: token.department || null,
          position: token.position || null,
          phone: token.phone || null,
          isActive: token.isActive || false,
          role: token.role || "USER",
          permissions: token.permissions || [],
          lastLoginAt: token.lastLoginAt || null,
          name: token.firstName && token.lastName 
            ? `${token.firstName} ${token.lastName}`.trim()
            : (token.username || session.user.name || "Unknown User"),
        };

        return {
          ...session,
          user: customUser,
        };
      }
      return session;
    },
  },
});