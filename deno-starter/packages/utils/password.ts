/**
 * Password Utility
 * 
 * Provides functions for secure password hashing and verification
 * using bcrypt algorithm.
 */

import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Standard settings for secure password hashing
const ROUNDS = 10; // Higher means more secure but slower

/**
 * Hashes a password using bcrypt
 * 
 * @param password The plaintext password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Generate a salt first, then hash with it
    const salt = await hash(ROUNDS.toString());
    return await hash(password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verifies a password against a stored hash
 * 
 * @param password The plaintext password to verify
 * @param storedHash The previously hashed password
 * @returns A promise that resolves to true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Use bcrypt to compare the password with the stored hash
    return await compare(password, storedHash);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Updates hash settings for all new passwords
 * This doesn't affect existing hashed passwords
 * 
 * @param rounds The number of rounds for bcrypt (higher = more secure but slower)
 */
export function updateHashSettings(rounds: number): void {
  if (rounds < 4 || rounds > 31) {
    throw new Error("Bcrypt rounds must be between 4 and 31");
  }
  
  Object.defineProperty(globalThis, "__BCRYPT_ROUNDS", {
    value: rounds,
    configurable: true
  });
}