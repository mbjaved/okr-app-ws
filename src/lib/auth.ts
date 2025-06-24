import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from 'bcryptjs'

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local')
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please add NEXTAUTH_SECRET to .env.local')
}

// Get database name from URI
const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
console.log(' Auth using database:', dbName);

// Create MongoDB client with connection pooling
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
});

// Initialize the client connection
const clientPromise = client.connect().catch(err => {
  console.error(' Failed to connect to MongoDB:', err);
  throw err;
});

// Initialize the MongoDB adapter with the client promise
const adapter = MongoDBAdapter(clientPromise);

export const authOptions: AuthOptions = {
  debug: true, // Enable debug logging
  logger: {
    error(code, metadata) {
      console.error('Auth Error:', { code, metadata });
    },
    warn(code) {
      console.warn('Auth Warning:', code);
    },
    debug(code, metadata) {
      console.log('Auth Debug:', { code, metadata });
    }
  },
  adapter,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔑 Authorization attempt with credentials:', { 
          email: credentials?.email,
          hasPassword: !!credentials?.password 
        });
        
        if (!credentials?.email) {
          console.log('❌ No email provided');
          throw new Error('Please enter your email');
        }
        
        if (!credentials?.password) {
          console.log('❌ No password provided');
          throw new Error('Please enter your password');
        }

        try {
          console.log('🔍 Searching for user in database...');
          const client = await clientPromise;
          const db = client.db(dbName);
          
          // Case-insensitive email search
          const user = await db.collection('users').findOne({
            email: { $regex: new RegExp(`^${credentials.email}$`, 'i') }
          });
          
          if (!user) {
            console.log(`❌ No user found with email: ${credentials.email}`);
            // For debugging: List all users in the database
            const allUsers = await db.collection('users')
              .find({}, { projection: { email: 1, name: 1, _id: 1 } })
              .toArray();
            console.log('👥 All users in database:', allUsers.map(u => u.email).join(', '));
            throw new Error('Invalid email or password');
          }

          if (!user.password) {
            console.log('❌ User has no password set');
            throw new Error('Invalid login method. Please try signing in with a different method.');
          }

          console.log('🔑 Comparing passwords...');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('❌ Password comparison failed');
            throw new Error('Invalid email or password');
          }
          
          console.log('✅ Authentication successful for user:', user.email);
          
          // Prepare the user object to be returned
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: user.role || 'User',
            department: user.department || null,
            image: user.avatarUrl || null
          };
        } catch (error) {
          console.error('❌ Error during authentication:', error);
          // Return null to indicate authentication failure
          // This will be handled by NextAuth to show appropriate error message
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        if (!profile.email) {
          throw new Error('Google account has no email. Please use an account with a verified email address.');
        }
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department as string;
        token._id = (user as any)._id;
        token.avatarUrl = (user as any).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        (session.user as any)._id = token._id;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Use secure cookies in production
  cookies: process.env.NODE_ENV === 'production' ? {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,

      }
    }
  } : undefined
}
