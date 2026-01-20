#ifndef SLINGSHOT_CONFIG_DISPLAY_HPP
#define SLINGSHOT_CONFIG_DISPLAY_HPP

namespace slingshot
{
    namespace display
    {

        // Target aspect ratio for game world (width / height)
        // Game logic uses this ratio; rendering scales to fit actual canvas
        constexpr float TARGET_ASPECT_RATIO = 16.0f / 9.0f;

        // Virtual game world dimensions (used for physics calculations)
        // The renderer will scale these to fit the actual canvas
        constexpr float WORLD_WIDTH = 1600.0f;
        constexpr float WORLD_HEIGHT = 900.0f;

        // Minimum dimensions before showing "screen too small" message
        constexpr int MIN_WIDTH = 480;
        constexpr int MIN_HEIGHT = 320;

        // Mobile: minimum width before suggesting landscape mode
        constexpr int LANDSCAPE_THRESHOLD = 600;

    } // namespace display
} // namespace slingshot

#endif
