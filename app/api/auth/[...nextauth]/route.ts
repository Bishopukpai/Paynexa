import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business"; 
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    // 🌐 1. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 📄 2. Custom Form Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password credentials.");
        }

        await dbConnect();
        const normalizedEmail = credentials.email.toLowerCase().trim();
        const business = await Business.findOne({ email: normalizedEmail });
        
        if (!business) {
          throw new Error("No business found matching that email address.");
        }

        // If there is no password string in the DB, it means they registered via Google OAuth
        if (!business.password) {
          throw new Error("This account was registered using Google. Please log in with Google.");
        }

        // Compare incoming password against database hash string
        const isPasswordMatch = await bcrypt.compare(credentials.password, business.password);
        if (!isPasswordMatch) {
          throw new Error("Incorrect password provided.");
        }

        // 🛡️ SECURITY BLOCKER: Halt authorization if email verification is outstanding
        if (business.isVerified === false) {
          throw new Error("Your email address has not been verified yet. Please check your inbox for the activation link.");
        }

        return {
          id: business._id.toString(),
          email: business.email,
          name: business.name,
          image: business.image,
        };
      }
    })
  ],
  callbacks: {
    // 🤝 Intercepts Google and Credential Sign-ins
    async signIn({ user, account }: { user: any; account: any }) {
      await dbConnect();
      try {
        // If it's a Google authentication cycle, make sure they exist in your DB layer
        if (account?.provider === "google") {
          const normalizedEmail = user.email?.toLowerCase().trim();
          const existingBusiness = await Business.findOne({ email: normalizedEmail });
          
          if (!existingBusiness) {
            await Business.create({
              name: user.name,
              email: normalizedEmail,
              image: user.image,
              provider: "google", 
              isVerified: true, // Google accounts are pre-verified via OAuth identity provider
            });
            console.log(`New merchant registered via Google: ${normalizedEmail}`);
          }
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },

    // 🏷️ Intermediate JWT callback required to pipe variables from Credentials authorize() into the session
    async jwt({ token, user, trigger, session }: { token: any; user: any; trigger?: string; session?: any }) {
      // Run only on initial sign in context
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
      }

      // 🔄 LISTEN FOR FRONTEND UPDATE CLIENT CALLS
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
      }

      return token;
    },

    // 🖥️ Exposes IDs and Blockchain Wallet configurations safely to frontend context hooks
    async session({ session, token }: { session: any; token: any }) {
      await dbConnect();
      try {
        const dbBusiness = await Business.findOne({ email: session.user?.email });
        if (dbBusiness) {
          session.user.walletAddress = dbBusiness.walletAddress || null;
          session.user.id = dbBusiness._id.toString();
        }
        
        // 🛡️ PRIORITY FIX: Live token updates take absolute precedence over old database values
        if (token) {
          if (token.name) session.user.name = token.name;
          if (token.picture) session.user.image = token.picture; // Safely maps updated picture to user image
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirects unauthenticated security middleware triggers back to your interface
    error: '/login',  // Redirects runtime context evaluation errors smoothly back to your login page UI
  },
  session: {
    strategy: "jwt", // Required structural baseline to combine forms and OAuth token streams
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };