#!/bin/bash
# Start script for GreenGrowth Local Dev

# Function to handle shutdown
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap SIGINT (Ctrl+C) and call the cleanup function
trap cleanup SIGINT

echo "Cleaning up any processes on ports 8000 and 5173..."
lsof -ti:8000 | xargs -r kill -9
lsof -ti:5173 | xargs -r kill -9


echo "Starting Backend on Port 8000..."
cd backend
# Using uv to run the uvicorn server directly within the project
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "GreenGrowth Platform is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both servers."

# Wait for background processes
wait
