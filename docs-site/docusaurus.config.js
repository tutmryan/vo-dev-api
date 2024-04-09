// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

require('dotenv').config()

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Verified Orchestration',
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
        title: 'Documentation Portal',
        logo: {
          alt: 'Verified Orchestration Logo',
          src: 'img/logo-secondary-greyscale-white.svg',
          srcDark: 'img/logo-primary-white.svg',
        },
        items: [
          {
            label: 'Tools',
            position: 'left',
            items: [
              {
                label: 'Apollo Sandbox',
                href: `${process.env.GRAPHQL_ENDPOINT}/graphql`,
                prependBaseUrlToHref: false,
              },
              {
                label: 'GraphQL Voyager',
                href: `${process.env.GRAPHQL_ENDPOINT}/voyager`,
                prependBaseUrlToHref: false,
              },
              {
                label: 'Issuance builder',
                href: `${process.env.ADMIN_URL}/issuance-builder`,
                prependBaseUrlToHref: false,
              },
              {
                label: 'Presentation builder',
                href: `${process.env.ADMIN_URL}/presentation-builder`,
                prependBaseUrlToHref: false,
              },
            ],
          },
        ],
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
    ADMIN_URL: process.env.ADMIN_URL,
    DEV_TOOLS_ENABLED: (process.env.DEV_TOOLS_ENABLED || 'true').toLowerCase() === 'true',
    INSTANCE: process.env.INSTANCE,
    API_CLIENT_ID: process.env.API_CLIENT_ID,
  },
}

module.exports = config
