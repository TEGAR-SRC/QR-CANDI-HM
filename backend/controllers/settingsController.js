const { pool } = require('../config/database');

// Get system settings
const getSettings = async (req, res) => {
  try {
    const [settings] = await pool.execute('SELECT * FROM system_config ORDER BY id ASC');
    
    // Convert array of settings to object
    const settingsObject = {};
    settings.forEach(setting => {
      let value = setting.config_value;
      
      // Parse JSON values
      if (setting.config_key.includes('_json') || ['whatsapp_notifications', 'email_notifications', 'auto_backup'].includes(setting.config_key)) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // If not JSON, keep as string
        }
      }
      
      // Parse numeric values
      if (['late_threshold', 'max_distance', 'default_location_lat', 'default_location_lng'].includes(setting.config_key)) {
        value = parseFloat(value) || 0;
      }
      
      settingsObject[setting.config_key] = value;
    });
    
    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan'
    });
  }
};

// Update system settings
const updateSettings = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const settings = req.body;
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      let stringValue = value;
      
      // Convert boolean and object values to JSON string
      if (typeof value === 'boolean' || typeof value === 'object') {
        stringValue = JSON.stringify(value);
      }
      
      // Convert number to string
      if (typeof value === 'number') {
        stringValue = value.toString();
      }
      
      // Upsert setting
      await connection.execute(`
        INSERT INTO system_config (config_key, config_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `, [key, stringValue]);
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pengaturan berhasil disimpan'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan pengaturan'
    });
  } finally {
    connection.release();
  }
};

// Get specific setting
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const [settings] = await pool.execute('SELECT * FROM system_config WHERE config_key = ?', [key]);
    
    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan tidak ditemukan'
      });
    }
    
    let value = settings[0].config_value;
    
    // Parse JSON values
    if (key.includes('_json') || ['whatsapp_notifications', 'email_notifications', 'auto_backup'].includes(key)) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // If not JSON, keep as string
      }
    }
    
    // Parse numeric values
    if (['late_threshold', 'max_distance', 'default_location_lat', 'default_location_lng'].includes(key)) {
      value = parseFloat(value) || 0;
    }
    
    res.json({
      success: true,
      data: {
        key: settings[0].config_key,
        value: value
      }
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan'
    });
  }
};

// Update specific setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    let stringValue = value;
    
    // Convert boolean and object values to JSON string
    if (typeof value === 'boolean' || typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }
    
    // Convert number to string
    if (typeof value === 'number') {
      stringValue = value.toString();
    }
    
    // Upsert setting
    await pool.execute(`
      INSERT INTO system_config (config_key, config_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
    `, [key, stringValue]);
    
    res.json({
      success: true,
      message: 'Pengaturan berhasil disimpan'
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan pengaturan'
    });
  }
};

// Reset settings to default
const resetSettings = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete all current settings
    await connection.execute('DELETE FROM system_config');
    
    // Insert default settings
    const defaultSettings = [
      ['school_name', 'Sekolah Candi QR'],
      ['school_logo', '/logo.png'],
      ['school_address', 'Jl. Pendidikan No. 123, Jakarta'],
      ['school_phone', '021-1234567'],
      ['school_email', 'info@candiqr.com'],
      ['school_website', 'https://candiqr.com'],
      ['primary_color', '#3B82F6'],
      ['attendance_start_time', '07:00'],
      ['attendance_end_time', '15:00'],
      ['late_threshold', '15'],
      ['max_distance', '100'],
      ['default_location_lat', '-6.2088'],
      ['default_location_lng', '106.8456'],
      ['whatsapp_notifications', 'true'],
      ['email_notifications', 'true'],
      ['auto_backup', 'true'],
      ['backup_frequency', 'daily']
    ];
    
    for (const [key, value] of defaultSettings) {
      await connection.execute(
        'INSERT INTO system_config (config_key, config_value) VALUES (?, ?)',
        [key, value]
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pengaturan berhasil direset ke default'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mereset pengaturan'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSetting,
  updateSetting,
  resetSettings
};