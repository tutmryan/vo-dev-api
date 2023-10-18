// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

require('dotenv').config()

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Verified Orchestration - Developer Portal',
  tagline:
    'Empowering organizations with a user-centric approach to manage and integrate decentralized identity and verifiable credentials, simplifying deployment and fostering intuitive trust.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-test-site.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      '@graphql-markdown/docusaurus',
      {
        schema: '../src/**/*.graphql',
        baseURL: 'reference',
        linkRoot: '/docs',
        loaders: {
          GraphQLFileLoader: '@graphql-tools/graphql-file-loader',
        },
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        style: 'primary',
        title: 'Developer Portal',
        logo: {
          alt: 'Verified Orchestration Logo',
          src: 'img/logo-secondary-greyscale-white.svg',
          srcDark: 'img/logo-primary-white.svg',
        },
        items: [],
      },
      footer: {
        style: 'dark',
        links: [],
        logo: {
          alt: 'Verified Orchestration Logo',
          src: 'img/logo-primary-white.svg',
          width: '20%',
        },
        copyright: `© ${new Date().getFullYear()} Verified Orchestration, all rights reserved.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  customFields: {
    GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
  },
}

module.exports = config
