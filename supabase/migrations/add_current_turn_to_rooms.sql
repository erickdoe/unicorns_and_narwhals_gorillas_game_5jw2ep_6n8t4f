/*
  # Add current_turn to game_rooms

  1. Changes
    - Add `current_turn` column to `game_rooms` table to track the active player index.
    - Default value is 0.
*/

ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS current_turn INTEGER DEFAULT 0;