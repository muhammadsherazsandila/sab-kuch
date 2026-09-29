// @ts-check
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1. Ignore build outputs and artifacts
  {
    ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "**/dev-dist/**"],
  },

  // 2. Base Configuration for JavaScript and TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. React Specific Configurations
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Pull in the default React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Disable base ESLint rules handled by TypeScript
      "no-unused-vars": "off",
      "no-undef": "off",
      "react-hooks/set-state-in-effect": "off",

      // Modern React (React 17+) doesn't require importing 'React' in every file
      "react/react-in-jsx-scope": "off",

      // Common TypeScript/React adjustments
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
);
