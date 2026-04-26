/*
      # Add landscape to game_rooms

      1. Changes
        - Add `landscape` column to `game_rooms` table to store the generated terrain as a JSON string.
    */
    ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS landscape text;