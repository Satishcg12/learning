-- Migration: create todo table
-- Created at: 2025-04-28T12:33:26.260Z

-- Write your UP migration SQL here

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

