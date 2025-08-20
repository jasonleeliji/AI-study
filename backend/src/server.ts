
import app, { initializeConfigs } from './app';
import config from './config';
import { connectDB } from './config/db';
import { initRealtimeService, checkStaleSessions, updateRemainingTimeForActiveUsers } from './services/realtime.service';
import { checkTimeLimitExceeded } from './services/timeLimit.service';

const PORT = config.port || 5000;

// 启动服务器
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize configurations
    await initializeConfigs();
    
    // Create an HTTP server from the Express app and initialize WebSocket service
    const server = initRealtimeService(app);

    server.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
      
      // Start background job to clean up stale sessions
      setInterval(checkStaleSessions, 60 * 1000); // Check every minute
      console.log('Stale session checker started.');
      
      // Start background job to check time limit exceeded
      setInterval(checkTimeLimitExceeded, 30 * 1000); // Check every 30 seconds
      console.log('Time limit checker started.');
      
      // Start background job to update remaining time for active users
      setInterval(updateRemainingTimeForActiveUsers, 1000); // Update every second
      console.log('Remaining time updater started.');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
