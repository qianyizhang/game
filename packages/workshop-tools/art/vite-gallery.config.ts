import { defineConfig } from 'vite';
import base from '../../../vite.config.ts';
import { artHistoryPlugin } from './history-server.ts';

/** Local gallery effects are excluded from production and native bake configuration. */
export default defineConfig({ ...base, plugins: [...(base.plugins ?? []), artHistoryPlugin()] });
