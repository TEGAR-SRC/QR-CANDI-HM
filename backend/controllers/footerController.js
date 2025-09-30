const { pool } = require('../config/database');

// Get all footer settings
const getFooterSettings = async (req, res) => {
  try {
    const [settings] = await pool.execute(
      'SELECT * FROM footer_settings WHERE is_active = 1 ORDER BY setting_key'
    );

    // Convert array to object for easier access
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    // Parse JSON fields
    if (settingsObj.footer_links) {
      try {
        settingsObj.footer_links = JSON.parse(settingsObj.footer_links);
      } catch (e) {
        settingsObj.footer_links = [];
      }
    }

    if (settingsObj.social_media) {
      try {
        settingsObj.social_media = JSON.parse(settingsObj.social_media);
      } catch (e) {
        settingsObj.social_media = {};
      }
    }

    // Generate copyright text with current year if show_year is true
    if (settingsObj.show_year === 'true') {
      const currentYear = new Date().getFullYear();
      settingsObj.copyright_text = settingsObj.copyright_text.replace(/\d{4}/, currentYear);
    }

    res.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error('Get footer settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get footer settings for admin (with all fields)
const getFooterSettingsAdmin = async (req, res) => {
  try {
    const [settings] = await pool.execute(
      'SELECT * FROM footer_settings ORDER BY setting_key'
    );

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get footer settings admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update footer settings
const updateFooterSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Data pengaturan tidak valid'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const [key, value] of Object.entries(settings)) {
        // Handle JSON fields
        let processedValue = value;
        if (key === 'footer_links' || key === 'social_media') {
          processedValue = JSON.stringify(value);
        }

        await connection.execute(
          'INSERT INTO footer_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP',
          [key, processedValue]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Pengaturan footer berhasil diperbarui'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update footer settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Reset footer settings to default
const resetFooterSettings = async (req, res) => {
  try {
    const defaultSettings = {
      company_name: 'EduPus.id',
      system_name: 'Candi QR',
      system_description: 'Sistem Absensi Sekolah Digital',
      copyright_text: '© 2024 EduPus.id. Sistem Absensi Sekolah Digital.',
      show_year: 'true',
      footer_links: [],
      contact_email: 'support@edupus.id',
      contact_phone: '+62 123 456 7890',
      address: 'Jl. Pendidikan No. 123, Jakarta',
      social_media: {}
    };

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const [key, value] of Object.entries(defaultSettings)) {
        let processedValue = value;
        if (key === 'footer_links' || key === 'social_media') {
          processedValue = JSON.stringify(value);
        }

        await connection.execute(
          'INSERT INTO footer_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP',
          [key, processedValue]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Pengaturan footer berhasil direset ke default'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Reset footer settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getFooterSettings,
  getFooterSettingsAdmin,
  updateFooterSettings,
  resetFooterSettings
};