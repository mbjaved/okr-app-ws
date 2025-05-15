import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcryptjs";
import { User } from "@/lib/user-model";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        const user = await User.findByEmail(credentials.email);
        if (!user) throw new Error("No user found");
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");
        // Return _id for JWT callback, convert _id to string
        return { _id: user._id.toString(), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Can be customized
  },
  callbacks: {
    async session({ session, token }) {
      // Always fetch latest user from DB for avatarUrl and other info
      try {
        let dbUser = null;
        if (session?.user?.email) {
          dbUser = await require('./user-model').User.findByEmail(session.user.email);
        }
        if (dbUser) {
          session.user.avatarUrl = dbUser.avatarUrl || `/avatars/${dbUser.username || dbUser.email.split("@")[0]}.svg`;
          session.user.name = dbUser.name;
          session.user.role = dbUser.role;
          session.user._id = dbUser._id?.toString?.() || dbUser._id;
        } else {
          // Fallback: use token or SVG
          session.user.avatarUrl = token.avatarUrl || `/avatars/${session.user.email?.split("@")[0]}.svg`;
        }
      } catch (e) {
        // Fallback: use token or SVG
        session.user.avatarUrl = token.avatarUrl || `/avatars/${session.user.email?.split("@")[0]}.svg`;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Always persist _id, role, and avatarUrl to the JWT
      if (user) {
        token.role = user.role;
        // Accept _id from either provider (Google or Credentials)
        if (user._id) token._id = typeof user._id === 'string' ? user._id : user._id.toString();
        if ((user as any).id && !(user as any)._id) token._id = (user as any).id;
        // Persist avatarUrl from the user object if present
        if ((user as any).avatarUrl) token.avatarUrl = (user as any).avatarUrl;
      }
      return token;
    },
  },
};
