import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business"; // Updated to your Business model

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // We destructure { user } and type it as any or use the specific NextAuth User type
    async signIn({ user }: { user: any }) {
      await dbConnect();
      try {
        const existingBusiness = await Business.findOne({ email: user.email });
        
        if (!existingBusiness) {
          await Business.create({
            name: user.name,
            email: user.email,
            image: user.image,
            // walletAddress will default to null/empty based on your schema
          });
          console.log(`New merchant registered: ${user.email}`);
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },

    async session({ session }: { session: any }) {
      await dbConnect();
      try {
        // Find the business in your DB to attach the wallet address to the browser session
        const dbBusiness = await Business.findOne({ email: session.user?.email });
        if (dbBusiness) {
          session.user.walletAddress = dbBusiness.walletAddress;
          session.user.id = dbBusiness._id;
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Optional: your custom login page
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };