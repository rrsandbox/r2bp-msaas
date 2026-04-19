import { PrismaAdapter } from "@auth/prisma-adapter";
import { type RoleKey } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/infra/db/prisma";
import { authenticateUser } from "@/modules/auth/application/authenticate-user";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        twoFactorTicket: { label: "Ticket 2FA", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.twoFactorTicket) {
          const { consumeTwoFactorTicket } = await import("@/modules/auth/application/two-factor");
          const ticketUser = await consumeTwoFactorTicket(String(credentials.twoFactorTicket));

          return {
            id: ticketUser.id,
            email: ticketUser.email,
            name: ticketUser.name,
            role: ticketUser.role,
            tenantId: ticketUser.tenantId,
            tenantName: ticketUser.tenantName,
            tenantSlug: ticketUser.tenantSlug,
            tenantStatus: ticketUser.tenantStatus,
            tenantOnboardingStatus: ticketUser.tenantOnboardingStatus,
            userStatus: ticketUser.userStatus,
            isProfileComplete: ticketUser.isProfileComplete,
            requiresTwoFactor: false,
          };
        }

        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await authenticateUser({
          email: String(credentials.email),
          password: String(credentials.password),
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
          tenantSlug: user.tenantSlug,
          tenantStatus: user.tenantStatus,
          tenantOnboardingStatus: user.tenantOnboardingStatus,
          userStatus: user.userStatus,
          isProfileComplete: user.isProfileComplete,
          requiresTwoFactor: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantSlug = user.tenantSlug;
        token.tenantStatus = user.tenantStatus;
        token.tenantOnboardingStatus = user.tenantOnboardingStatus;
        token.userStatus = user.userStatus;
        token.isProfileComplete = user.isProfileComplete;
        token.requiresTwoFactor = user.requiresTwoFactor;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as RoleKey | undefined;
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.tenantName = token.tenantName as string | undefined;
        session.user.tenantSlug = token.tenantSlug as string | undefined;
        session.user.tenantStatus = token.tenantStatus as string | undefined;
        session.user.tenantOnboardingStatus = token.tenantOnboardingStatus as string | undefined;
        session.user.userStatus = token.userStatus as string | undefined;
        session.user.isProfileComplete = Boolean(token.isProfileComplete);
        session.user.requiresTwoFactor = Boolean(token.requiresTwoFactor);
      }

      return session;
    },
    authorized({ auth, request }) {
      return Boolean(auth) || !request.nextUrl.pathname.startsWith("/api/auth");
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
} satisfies NextAuthConfig;