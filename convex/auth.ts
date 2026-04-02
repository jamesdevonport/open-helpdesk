import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

const password = Password({
  profile: (params) => {
    const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
    if (!email) {
      throw new Error("Email is required");
    }

    const name =
      typeof params.name === "string" && params.name.trim().length > 0
        ? params.name.trim()
        : undefined;

    return {
      email,
      ...(name ? { name } : {}),
    };
  },
  validatePasswordRequirements(password) {
    if (password.trim().length < 12) {
      throw new Error("Password must be at least 12 characters long.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [password],
});
