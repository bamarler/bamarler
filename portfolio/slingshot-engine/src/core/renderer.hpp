#ifndef SLINGSHOT_CORE_RENDERER_HPP
#define SLINGSHOT_CORE_RENDERER_HPP

#include <SDL2/SDL.h>
#include <vector>
#include "math/vec2.hpp"
#include "config/colors.hpp"

namespace slingshot
{

    class Renderer
    {
    public:
        void init(SDL_Renderer *renderer);
        void setScale(float scale, float offsetX, float offsetY);

        // Screen coordinate conversion (for entities to use)
        int toScreenX(float worldX) const;
        int toScreenY(float worldY) const;
        int toScreenSize(float worldSize) const;

        // Primitives
        void clear(const colors::Color &color);
        void drawCircle(Vec2 center, float radius, const colors::Color &color);
        void fillCircle(Vec2 center, float radius, const colors::Color &color);
        void drawLine(Vec2 a, Vec2 b, const colors::Color &color);
        void drawDashedLine(Vec2 a, Vec2 b, const colors::Color &color, float dashLength = 10.0f);

        // Effects
        void drawGlow(Vec2 center, float innerRadius, float outerRadius, const colors::Color &color);
        void drawTrail(const std::vector<Vec2> &trail, const colors::Color &color);

        // UI elements
        void drawSlingshot(Vec2 anchor, Vec2 current, float maxRadius);

        void present();

    private:
        SDL_Renderer *m_renderer = nullptr;
        float m_scale = 1.0f;
        float m_offsetX = 0.0f;
        float m_offsetY = 0.0f;
    };

} // namespace slingshot

#endif
