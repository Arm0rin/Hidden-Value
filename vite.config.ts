import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
export default defineConfig({ plugins:[preact()], build:{target:'es2020'}, test:{environment:'node',globals:true} });
