// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

require('dotenv').config()

const {
  themes: { github: lightCodeTheme, dracula: darkCodeTheme },
} = require('prism-react-renderer')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'VO',
  tagline:
    'Empowering organizations with a user-centric approach to manage and integrate decentralized identity and verifiable credentials, simplifying deployment and fostering intuitive trust.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.idbyvo.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

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
          sidebarPath: require.resolve('./sidebarsDocumentation.js'),
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
      '@docusaurus/plugin-content-docs',
      {
        id: 'api-reference',
        path: 'api-reference',
        routeBasePath: 'api-reference',
        sidebarPath: './sidebarsApiReference.js',
      },
    ],
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'release-notes',
        routeBasePath: 'release-notes',
        path: 'release-notes',
        blogTitle: 'Release notes',
        blogDescription: 'Release notes',
        blogSidebarCount: 10,
        blogSidebarTitle: 'Recent releases',
      },
    ],
    [
      '@graphql-markdown/docusaurus',
      {
        schema: '../src/generated/schema.json',
        rootPath: '.',
        baseURL: 'api-reference',
        linkRoot: '/',
        loaders: {
          JsonFileLoader: '@graphql-tools/json-file-loader',
        },
      },
    ],
    [
      '@docusaurus/plugin-google-gtag',
      {
        trackingID: 'G-0GRTVWG5E5',
        anonymizeIP: false,
      },
    ],
  ],

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
      type: 'text/css',
    },
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        style: 'primary',
        logo: {
          alt: 'VO Logo',
          src: 'img/logo-secondary-greyscale-white.svg',
          srcDark: 'img/logo-primary-white.svg',
        },
        items: [
          {
            to: 'docs',
            label: 'Documentation',
            position: 'left',
          },
          {
            to: 'api-reference',
            label: 'API reference',
            position: 'left',
          },
          {
            to: 'release-notes',
            label: 'Release notes',
            position: 'left',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [],
        logo: {
          alt: 'VO Logo',
          src: 'img/logo-primary-white.svg',
          width: '20%',
        },
        copyright: `© ${new Date().getFullYear()} VO Tech, all rights reserved.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
}

module.exports = config
