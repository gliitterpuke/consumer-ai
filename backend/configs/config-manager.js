const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.configsPath = path.join(__dirname, 'agents');
    this.loadedConfigs = new Map();
    this.fileWatchers = new Map();
    this.hotReloadEnabled = process.env.NODE_ENV === 'development';
  }

  loadAllAgentConfigs(communityId) {
    try {
      const configFiles = fs.readdirSync(this.configsPath)
        .filter(file => file.endsWith('.json'));

      const configs = {};
      
      for (const file of configFiles) {
        const agentId = path.basename(file, '.json');
        const config = this.loadAgentConfig(agentId);
        
        if (config) {
          configs[agentId] = config;
          console.log(`📄 Loaded config for ${config.name}`);
        }
      }

      console.log(`✅ Loaded ${Object.keys(configs).length} agent configurations`);
      return configs;
      
    } catch (error) {
      console.error('❌ Error loading agent configs:', error.message);
      return {};
    }
  }

  loadAgentConfig(agentId) {
    try {
      const configPath = path.join(this.configsPath, `${agentId}.json`);
      
      if (!fs.existsSync(configPath)) {
        console.warn(`⚠️  Config file not found: ${agentId}.json`);
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Validate required fields
      if (!this.validateConfig(config)) {
        console.error(`❌ Invalid config for ${agentId}`);
        return null;
      }

      // Cache the config
      this.loadedConfigs.set(agentId, {
        ...config,
        loadedAt: Date.now()
      });

      // Set up hot reload if enabled
      if (this.hotReloadEnabled) {
        this.setupHotReload(agentId, configPath);
      }

      return config;
      
    } catch (error) {
      console.error(`❌ Error loading config for ${agentId}:`, error.message);
      return null;
    }
  }

  validateConfig(config) {
    const requiredFields = ['id', 'name', 'personality', 'llm_config', 'behavior_config'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(`❌ Missing required field: ${field}`);
        return false;
      }
    }

    // Validate LLM config
    const llmRequired = ['model', 'temperature', 'maxOutputTokens'];
    for (const field of llmRequired) {
      if (config.llm_config[field] === undefined) {
        console.error(`❌ Missing LLM config field: ${field}`);
        return false;
      }
    }

    // Validate behavior config
    const behaviorRequired = ['response_probability', 'min_delay_ms', 'max_delay_ms'];
    for (const field of behaviorRequired) {
      if (config.behavior_config[field] === undefined) {
        console.error(`❌ Missing behavior config field: ${field}`);
        return false;
      }
    }

    return true;
  }

  setupHotReload(agentId, configPath) {
    // Clean up existing watcher
    if (this.fileWatchers.has(agentId)) {
      this.fileWatchers.get(agentId).close();
    }

    // Set up new file watcher
    const watcher = fs.watchFile(configPath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        console.log(`🔄 Config changed for ${agentId}, reloading...`);
        this.loadAgentConfig(agentId);
      }
    });

    this.fileWatchers.set(agentId, watcher);
  }

  getConfig(agentId) {
    return this.loadedConfigs.get(agentId);
  }

  getAllConfigs() {
    return Object.fromEntries(this.loadedConfigs);
  }

  mergeWithInlineConfig(agentId, inlineConfig) {
    const fileConfig = this.getConfig(agentId);
    if (!fileConfig) return inlineConfig;

    // File config takes precedence over inline config
    return {
      ...inlineConfig,
      ...fileConfig,
      llm_config: {
        ...inlineConfig.llm_config,
        ...fileConfig.llm_config
      },
      behavior_config: {
        ...inlineConfig.behavior_config,
        ...fileConfig.behavior_config
      }
    };
  }

  cleanup() {
    // Close all file watchers
    for (const watcher of this.fileWatchers.values()) {
      if (watcher && typeof watcher.close === 'function') {
        watcher.close();
      }
    }
    this.fileWatchers.clear();
    this.loadedConfigs.clear();
  }
}

module.exports = ConfigManager;