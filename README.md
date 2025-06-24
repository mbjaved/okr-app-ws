# OKR Application

A modern Objective and Key Results (OKR) tracking application built with Next.js, NextAuth.js, and MongoDB.

## Features

- User authentication with email/password
- Create and manage OKRs (Objectives and Key Results)
- Track progress with visual indicators
- Responsive design for all devices
- Dark mode support
- Real-time updates

## Prerequisites

- Node.js 18 or later
- npm or yarn
- MongoDB database (local or Atlas)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/okr-app.git
   cd okr-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy the `env.example` file to `.env.local`
   - Update the environment variables with your configuration

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework for server-rendered applications
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://zod.dev/) - Schema validation
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications

## Project Structure

```
okr-app/
├── src/
│   ├── app/                  # App router
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard page
│   │   └── ...
│   ├── components/          # Reusable components
│   ├── lib/                  # Utility functions
│   └── types/                # TypeScript types
├── public/                   # Static files
└── ...
```

## Development

1. Follow the [Getting Started](#getting-started) guide to set up the project
2. Create a new branch for your feature: `git checkout -b feature/your-feature`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## Testing

To run tests:

```bash
npm test
# or
yarn test
```

## Linting

```bash
npm run lint
# or
yarn lint
```

## Formatting

```bash
npm run format
# or
yarn format
```

## Deployment

### Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Other Platforms

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details on deploying to other platforms.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
