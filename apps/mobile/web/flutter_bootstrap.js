// Flutter Web bootstrap file
//
// This file is used by `flutter build web` as an input template.
// Flutter replaces the `{{...}}` placeholders during the build.
//
// See: https://docs.flutter.dev/platform-integration/web/initialization

{{flutter_js}}
{{flutter_build_config}}

_flutter.loader.load({
  onEntrypointLoaded: async function (engineInitializer) {
    const appRunner = await engineInitializer.initializeEngine();
    await appRunner.runApp();
  },
});
