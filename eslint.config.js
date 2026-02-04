import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist", 
      "build", 
      "node_modules", 
      "*.config.js", 
      "*.config.ts", 
      "doodle-hub-delight/**",
      "frontend-backup*/**",
      "supabase/migrations/**",
      "public/**",
      "coverage/**"
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true 
      }],
      
      // Design system specific rules for better development experience
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Component development rules
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unused-locals": "off",
      "@typescript-eslint/no-unused-parameters": "off",
      
      // Performance and best practices
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      
      // React specific rules
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      
      // Prevent hardcoded Tailwind colors - use semantic tokens instead
      "no-restricted-syntax": [
        "warn",
        {
          "selector": "Literal[value=/\\b(bg-white|bg-black|bg-gray-|text-white|text-black|text-gray-|border-white|border-black|border-gray-|bg-slate-|text-slate-|border-slate-)\\b/]",
          "message": "Avoid hardcoded colors. Use semantic tokens instead: bg-background, bg-card, bg-muted, text-foreground, text-muted-foreground, border-border, etc."
        },
        {
          "selector": "TemplateLiteral[quasis.0.value.raw=/\\b(bg-white|bg-black|bg-gray-|text-white|text-black|text-gray-|border-white|border-black|border-gray-|bg-slate-|text-slate-|border-slate-)\\b/]",
          "message": "Avoid hardcoded colors. Use semantic tokens instead: bg-background, bg-card, bg-muted, text-foreground, text-muted-foreground, border-border, etc."
        },
        {
          "selector": "CallExpression[callee.property.name='select'][arguments.0.value='*']",
          "message": "Avoid select('*'). Specify explicit columns for better performance: select('id, name, status')"
        }
      ],
      
      // Import organization
      "sort-imports": ["error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
        "allowSeparatedGroups": true
      }],
    },
  },
  
  // Specific rules for doodle components to allow creative flexibility
  {
    files: [
      "src/components/doodles/**/*.{ts,tsx}", 
      "src/components/enhanced/**/*.{ts,tsx}",
      "src/lib/design-system/**/*.{ts,tsx}"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      "no-console": "off", // Allow console for design system debugging
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  
  // Configuration files have different rules
  {
    files: ["*.config.{js,ts}", "vite.config.ts", "tailwind.config.js"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  
  // Test files have relaxed rules
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  },
);