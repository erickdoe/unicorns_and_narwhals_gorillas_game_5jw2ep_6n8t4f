/*
      # Setup Game Rooms for Multiplayer

      1. New Tables
        - `game_rooms`
          - `id` (text, primary key): The Room ID entered by the user.
          - `created_at` (timestamptz): When the room was created.
          - `player_count` (int): Number of players currently in the room.
          - `status` (text): Current state of the room ('waiting', 'playing', 'finished').

      2. Security
        - Enable RLS on `game_rooms` table.
        - Create a policy allowing public access for this casual game (anyone can join/update rooms).

      3. Realtime
        - Add `game_rooms` to the `supabase_realtime` publication to enable real-time listeners.
    */

    CREATE TABLE IF NOT EXISTS game_rooms (
      id text PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      player_count int DEFAULT 0,
      status text DEFAULT 'waiting'
    );

    ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

    -- Allow anyone to read, insert, and update room data for the game
    CREATE POLICY "Public access to game rooms" 
      ON game_rooms 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);

    -- CRITICAL: Enable Realtime for this table
    -- This allows the frontend to use .on('postgres_changes', ...)
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;