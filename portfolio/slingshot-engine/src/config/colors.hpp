#ifndef SLINGSHOT_CONFIG_COLORS_HPP
#define SLINGSHOT_CONFIG_COLORS_HPP

#include <cstdint>

namespace slingshot
{
    namespace colors
    {

        struct Color
        {
            uint8_t r;
            uint8_t g;
            uint8_t b;
            uint8_t a;

            constexpr Color(uint8_t r_, uint8_t g_, uint8_t b_, uint8_t a_ = 255)
                : r(r_), g(g_), b(b_), a(a_) {}

            static constexpr Color fromHex(uint32_t hex, uint8_t alpha = 255)
            {
                return Color(
                    (hex >> 16) & 0xFF,
                    (hex >> 8) & 0xFF,
                    hex & 0xFF,
                    alpha);
            }

            constexpr Color withAlpha(uint8_t newAlpha) const
            {
                return Color(r, g, b, newAlpha);
            }
        };

        // Primary (Plum to Rose gradient)
        constexpr Color PRIMARY_DARK = Color::fromHex(0x410056);
        constexpr Color PRIMARY_MID = Color::fromHex(0x8e4585);
        constexpr Color PRIMARY_LIGHT = Color::fromHex(0xc4739b);

        // Accent (Amber)
        constexpr Color ACCENT_PRIMARY = Color::fromHex(0xf59e0b);
        constexpr Color ACCENT_HOVER = Color::fromHex(0xfbbf24);

        // Background
        constexpr Color BG_DARK = Color::fromHex(0x0a0414);
        constexpr Color BG_SURFACE = Color::fromHex(0x1a1125);

        // Text
        constexpr Color TEXT_PRIMARY = Color::fromHex(0xfaf8fc);
        constexpr Color TEXT_MUTED = Color::fromHex(0xc1b3cd);

        // Entity colors
        namespace entity
        {
            constexpr Color AGENT = TEXT_PRIMARY;
            constexpr Color AGENT_TRAIL = TEXT_PRIMARY.withAlpha(128);

            constexpr Color PLANET_FILL = PRIMARY_DARK;
            constexpr Color PLANET_GLOW = PRIMARY_MID;

            constexpr Color SUN_CORE = ACCENT_PRIMARY;
            constexpr Color SUN_GLOW = ACCENT_HOVER;

            constexpr Color SINGULARITY_CENTER = BG_DARK;
            constexpr Color SINGULARITY_DISK_INNER = PRIMARY_MID;
            constexpr Color SINGULARITY_DISK_OUTER = PRIMARY_LIGHT;

            constexpr Color ASTEROID_FILL = Color::fromHex(0x4a3d5c);
            constexpr Color ASTEROID_STROKE = TEXT_MUTED;

            constexpr Color GOAL_RING = ACCENT_PRIMARY;
            constexpr Color GOAL_FILL = ACCENT_PRIMARY.withAlpha(25);

            constexpr Color SLINGSHOT_LINE = ACCENT_PRIMARY;
            constexpr Color SLINGSHOT_ANCHOR = ACCENT_HOVER;
        }

        // UI colors
        namespace ui
        {
            constexpr Color OVERLAY_BG = BG_DARK.withAlpha(200);
            constexpr Color BUTTON_PRIMARY = ACCENT_PRIMARY;
            constexpr Color BUTTON_HOVER = ACCENT_HOVER;
            constexpr Color TEXT = TEXT_PRIMARY;
            constexpr Color TEXT_SECONDARY = TEXT_MUTED;
        }

    } // namespace colors
} // namespace slingshot

#endif
