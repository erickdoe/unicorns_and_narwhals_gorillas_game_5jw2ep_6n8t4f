/*
  # Add Landscape and Turn Tracking to Game Rooms

  1. Changes
    - Add `landscape` column to `game_rooms` to store the generated terrain map as a JSON string.
    - Add `current_turn` column to `game_rooms` to synchronize which player's turn it is across all clients.

  2. Security
    - These columns are managed via the existing "Public access to game rooms" policy.
*/

ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS landscape text,
ADD COLUMN IF NOT EXISTS current_turn int DEFAULT 0;