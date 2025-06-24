import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      department: string;
      _id?: string;
      avatarUrl?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    department: string;
    _id?: string;
    avatarUrl?: string;
    password?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    department: string;
    _id?: string;
    avatarUrl?: string;
  }
}
