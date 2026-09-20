const { withProjectBuildGradle } = require("@expo/config-plugins");

const NOTIFEE_REPOSITORY =
  '    maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

module.exports = function withNotifeeAndroid(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (
      gradleConfig.modResults.contents.includes(
        "node_modules/@notifee/react-native/android/libs",
      )
    ) {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
      /allprojects \{\n  repositories \{\n([\s\S]*?)  \}\n\}/,
      (match, repositoriesBlock) => {
        if (repositoriesBlock.includes(NOTIFEE_REPOSITORY.trim())) {
          return match;
        }

        return `allprojects {\n  repositories {\n${repositoriesBlock}${NOTIFEE_REPOSITORY}\n  }\n}`;
      },
    );

    return gradleConfig;
  });
};
