import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tata-dashboard';
    
    // Ensure database name is included in connection string
    // If URI doesn't have database name, add it
    if (mongoURI.includes('?') && !mongoURI.match(/\/[^\/\?]+\?/)) {
      // URI has query params but no database name before the ?
      const [base, query] = mongoURI.split('?');
      // Remove trailing slash if present before adding database name
      const cleanBase = base.replace(/\/$/, '');
      mongoURI = `${cleanBase}/tata-dashboard?${query}`;
    } else if (!mongoURI.match(/\/[^\/]+$/) || mongoURI.endsWith('/')) {
      // URI ends with / or has no database path after port
      mongoURI = mongoURI.replace(/\/$/, '') + '/tata-dashboard';
    }
    
    console.log('[Database] Connecting to MongoDB...');
    console.log('[Database] URI:', mongoURI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    
    // Configure connection options with increased timeouts
    const options: any = {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 90000, // 90 seconds
      connectTimeoutMS: 60000, // 60 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      bufferCommands: false, // Disable mongoose buffering
    };
    
    // Handle TLS options if TLS is enabled
    if (mongoURI.includes('tls=true')) {
      // TLS certificate handling:
      // 1. If tlsCAFile is specified in URI, MongoDB driver will use it
      // 2. If certificate file doesn't exist, connection will fail
      // 3. For production: Either provide the certificate file OR use tlsAllowInvalidCertificates=true
      //    (Note: tlsAllowInvalidCertificates=true is less secure but may be needed if certificate is unavailable)
      
      // Check if tlsAllowInvalidCertificates is already in the URI
      if (!mongoURI.includes('tlsAllowInvalidCertificates')) {
        // Only set to false if not explicitly set in URI
        // This allows the URI to override this setting
        options.tlsAllowInvalidCertificates = false;
      }
      
      // Note: tlsCAFile path from URI will be used automatically by MongoDB driver
      // If the file doesn't exist at that path, connection will fail
      // In Coolify/Docker, you may need to mount the certificate file as a volume
    }
    
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`[Database] Connected to database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
    
    // Set global timeout for operations
    mongoose.set('bufferCommands', false);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Server will start but database operations may fail.');
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Check if MongoDB is running (local) or accessible (remote)');
    console.log('   2. Verify MONGODB_URI in .env file');
    console.log('   3. For local dev: Ensure MongoDB is installed and running');
    console.log('   4. For remote: Check network connectivity and credentials');
    console.log(`   5. Current URI: ${(process.env.MONGODB_URI || 'mongodb://localhost:27017/tata-dashboard').replace(/:[^:@]+@/, ':****@')}`);
    // Don't exit - let the server start anyway
  }
};

