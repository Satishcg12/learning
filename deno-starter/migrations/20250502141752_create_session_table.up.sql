-- Migration: create session table
-- Created at: 2025-05-02T14:17:52.483Z

-- Write your UP migration SQL here

CREATE TABLE session (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
