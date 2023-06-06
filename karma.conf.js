module.exports = function (config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    files: [
      { pattern: "src/**/*.ts" },

      'tests/unit/*.spec.js',
    ],
    preprocessors: {
      "**/*.ts": ["karma-typescript"]
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["Chrome"],

  });
};