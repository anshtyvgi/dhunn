-- Prevent negative coin balances at the database level
ALTER TABLE "User" ADD CONSTRAINT "User_coins_non_negative" CHECK (coins >= 0);
