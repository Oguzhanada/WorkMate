module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3001/en',
        'http://localhost:3001/en/search',
        'http://localhost:3001/en/providers',
        'http://localhost:3001/en/login',
      ],
      startServerCommand: '',  // server already started
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-setuid-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
