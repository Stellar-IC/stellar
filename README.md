# Stellar IC

## NPM scripts

### Build and dev scripts

- `dev` – start development server
- `build` – build production version of the app
- `preview` – locally preview production build

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `jest` – runs jest tests
- `jest:watch` – starts jest watch
- `test` – runs `jest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier

## Monitoring

We use [Canister Geek](https://cusyh-iyaaa-aaaah-qcpba-cai.raw.ic0.app/) to monitor canister logs and metrics. You can do this in a few steps:

1. Clone the [Canistergeek Demo UI](https://github.com/usergeek/canistergeek-demo-ui) repo
2. `cd canistergeek-demo-ui`
3. Update `webpack.config.js` dev server proxy setting to target port `4943`

   ```
    devServer: {
      proxy: {
        "/api": {
          target: "http://localhost:4943",
          changeOrigin: true,
          **pathRewrite**: {
            "^/api": "/api",
          },
        },
      }
    },

   ```

4. Follow the instructions in the Readme to start Canistergeek locally.
5. Build Canistergeek settings config and copy to the clipboard

   `node ./canistergeek.config.js | pbcopy`

6. Navigate to the "Settings" tab in the Canistergeek UI. By default, the URL is http://localhost:3001/settings
7. Paste the generated config and hit 'Save'
8. At this point, given you have already deployed the Stellar canisters locally, you should be able to monitor them.
