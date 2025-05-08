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
        // Return role for JWT callback, convert _id to string
        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
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
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role; // Add role to session
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      // Persist the role to the token
      if (user && user.role) {
        token.role = user.role;
      }
      return token;
    },
  },
};
