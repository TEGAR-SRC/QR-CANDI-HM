const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSchema() {
  let connection;
  
  try {
    // Connect to MySQL
    connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('🔗 Connected to MySQL server');

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'candi_qr_db';
    await new Promise((resolve, reject) => {
      connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Use the database
    await new Promise((resolve, reject) => {
      connection.query(`USE \`${dbName}\``, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(`📊 Using database '${dbName}'`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Executing schema...');
    
    await new Promise((resolve, reject) => {
      connection.query(schema, (err) => {
        if (err) {
          console.error('❌ Schema execution failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Schema executed successfully');
          resolve();
        }
      });
    });

    console.log('🎉 Database setup completed successfully!');
    
    // List all tables
    await new Promise((resolve, reject) => {
      connection.query('SHOW TABLES', (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log('📋 Tables created:');
          results.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
          });
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Run setup
runSchema();