import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleOAuthProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business";
import Affiliate from "../../../models/Affiliate";
import bcrypt from "bcryptjs";

const generateFallbackRefCode = (name?: string | null, email?: string | null): string => {
  if (name) {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanName.length > 0) return cleanName;
  }
  if (email) {
    const emailPrefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (emailPrefix.length > 0) return emailPrefix;
  }
  return `REF${Math.floor(1000 + Math.random() * 9000)}`;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleOAuthProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password credentials.");
        }

        await dbConnect();
        const normalizedEmail = credentials.email.toLowerCase().trim();

        // 1. Check Business model first (explicitly select hidden password)
        let userRecord: any = await Business.findOne({ email: normalizedEmail }).select("+password");
        let userRole = userRecord?.role || "user";
        let isAffiliateModel = false;

        // 2. Fallback to Affiliate model (explicitly select hidden password)
        if (!userRecord) {
          userRecord = await Affiliate.findOne({ email: normalizedEmail }).select("+password");
          userRole = "affiliate";
          isAffiliateModel = true;
        }

        if (!userRecord) {
          throw new Error("No account found matching that email address.");
        }

        // If password is still empty after select("+password"), then it truly is a Google OAuth account
        if (!userRecord.password) {
          throw new Error("This account was registered using Google. Please log in with Google.");
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, userRecord.password);
        if (!isPasswordMatch) {
          throw new Error("Incorrect password provided.");
        }

        // Check 1: Email verification
        if (userRecord.isVerified === false) {
          throw new Error("Your email address has not been verified yet.");
        }

        // 🛑 Strict Affiliate Approval Guard
        if (isAffiliateModel || userRole === "affiliate") {
          if (userRecord.status === "pending") {
            throw new Error("Your application is currently under review. Please await admin approval.");
          }
          if (userRecord.status === "rejected") {
            throw new Error("Your affiliate application was not approved.");
          }
          if (userRecord.status === "suspended") {
            throw new Error("Your affiliate account has been suspended.");
          }
          if (userRecord.status !== "approved") {
            throw new Error("Access restricted. Your account is not approved.");
          }
        }

        const fallbackCode = generateFallbackRefCode(userRecord.name, userRecord.email);

        return {
          id: userRecord._id.toString(),
          email: userRecord.email,
          name: userRecord.name,
          image: userRecord.image || null,
          role: userRole,
          status: userRecord.status || "approved", // Attach status
          affiliateCode: userRecord.affiliateCode || fallbackCode,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      await dbConnect();
      try {
        if (account?.provider === "google") {
          const normalizedEmail = user.email?.toLowerCase().trim();

          // 🛑 Prevent Google login from bypassing Affiliate status
          const existingAffiliate = await Affiliate.findOne({ email: normalizedEmail });
          if (existingAffiliate) {
            if (existingAffiliate.status !== "approved") {
              console.warn(`Blocked Google login attempt for non-approved affiliate: ${normalizedEmail}`);
              return false; // Rejects Google sign-in
            }
          }

          const existingBusiness = await Business.findOne({ email: normalizedEmail });

          if (!existingBusiness && !existingAffiliate) {
            const fallbackCode = generateFallbackRefCode(user.name, normalizedEmail);
            await Business.create({
              name: user.name,
              email: normalizedEmail,
              image: user.image,
              provider: "google",
              role: "user",
              isVerified: true,
              affiliateCode: fallbackCode,
            });
          }
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }: { token: any; user: any; trigger?: string; session?: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role || "user";
        token.status = user.status || "approved"; // Store status in JWT
        token.affiliateCode = user.affiliateCode;
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
        if (session.user.role) token.role = session.user.role;
        if (session.user.status) token.status = session.user.status;
        if (session.user.affiliateCode) token.affiliateCode = session.user.affiliateCode;
      }

      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      await dbConnect();
      try {
        const normalizedEmail = session.user?.email?.toLowerCase().trim();
        const dbUser: any =
          (await Business.findOne({ email: normalizedEmail })) ||
          (await Affiliate.findOne({ email: normalizedEmail }));

        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.walletAddress = dbUser.walletAddress || null;
          session.user.role = dbUser.role || token?.role || "user";
          session.user.status = dbUser.status || token?.status || "approved"; // Expose status on session
          session.user.affiliateCode =
            dbUser.affiliateCode || token?.affiliateCode || generateFallbackRefCode(dbUser.name, dbUser.email);
        } else if (token) {
          session.user.id = token.id;
          session.user.role = token.role || "user";
          session.user.status = token.status || "approved";
          session.user.affiliateCode =
            token.affiliateCode || generateFallbackRefCode(session.user?.name, session.user?.email);
        }

        if (token) {
          if (token.name) session.user.name = token.name;
          if (token.picture) session.user.image = token.picture;
          if (token.affiliateCode) session.user.affiliateCode = token.affiliateCode;
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };