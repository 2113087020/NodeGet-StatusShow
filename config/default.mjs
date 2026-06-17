// 用于生成配置文件 config.json

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import nodegetTheme from '../nodeget-theme.json' with { type: 'json' }
import pkg from '../package.json' with { type: 'json' }


export const defaultSiteTokens = [
    {
        "name": "Server",
        "backend_url": "wss://api.123906.xyz",
        "token": "n6FzBseulhOFXLX7Zieb0XLW4kZDfH5p"
    }
]

export function buildDefaultConfig() {
    const userPreferencesForm = nodegetTheme.user_preferences_form
    let defaultUserpreferences = {}
    if (userPreferencesForm) {
        userPreferencesForm.items.forEach(item => {
            defaultUserpreferences[item.key] = item.default
        })
    }
    let defaultConfig = {
        "user_preferences":defaultUserpreferences,
        "site_tokens": defaultSiteTokens
    }
    
    return defaultConfig
}
