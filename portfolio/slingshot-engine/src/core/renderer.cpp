#include "core/renderer.hpp"
#include "config/colors.hpp"
#include <cmath>

namespace slingshot
{

    void Renderer::init(SDL_Renderer *renderer)
    {
        m_renderer = renderer;
        SDL_SetRenderDrawBlendMode(m_renderer, SDL_BLENDMODE_BLEND);
    }

    void Renderer::setScale(float scale, float offsetX, float offsetY)
    {
        m_scale = scale;
        m_offsetX = offsetX;
        m_offsetY = offsetY;
    }

    int Renderer::toScreenX(float worldX) const
    {
        return static_cast<int>(worldX * m_scale + m_offsetX);
    }

    int Renderer::toScreenY(float worldY) const
    {
        return static_cast<int>(worldY * m_scale + m_offsetY);
    }

    int Renderer::toScreenSize(float worldSize) const
    {
        return static_cast<int>(worldSize * m_scale);
    }

    void Renderer::clear(const colors::Color &color)
    {
        SDL_SetRenderDrawColor(m_renderer, color.r, color.g, color.b, color.a);
        SDL_RenderClear(m_renderer);
    }

    void Renderer::drawCircle(Vec2 center, float radius, const colors::Color &color)
    {
        SDL_SetRenderDrawColor(m_renderer, color.r, color.g, color.b, color.a);

        int cx = toScreenX(center.x);
        int cy = toScreenY(center.y);
        int r = toScreenSize(radius);

        const int segments = 48;
        for (int i = 0; i < segments; i++)
        {
            float angle1 = static_cast<float>(i) / segments * 2.0f * M_PI;
            float angle2 = static_cast<float>(i + 1) / segments * 2.0f * M_PI;
            int x1 = cx + static_cast<int>(std::cos(angle1) * r);
            int y1 = cy + static_cast<int>(std::sin(angle1) * r);
            int x2 = cx + static_cast<int>(std::cos(angle2) * r);
            int y2 = cy + static_cast<int>(std::sin(angle2) * r);
            SDL_RenderDrawLine(m_renderer, x1, y1, x2, y2);
        }
    }

    void Renderer::fillCircle(Vec2 center, float radius, const colors::Color &color)
    {
        SDL_SetRenderDrawColor(m_renderer, color.r, color.g, color.b, color.a);

        int cx = toScreenX(center.x);
        int cy = toScreenY(center.y);
        int r = toScreenSize(radius);

        for (int y = -r; y <= r; y++)
        {
            int dx = static_cast<int>(std::sqrt(r * r - y * y));
            SDL_RenderDrawLine(m_renderer, cx - dx, cy + y, cx + dx, cy + y);
        }
    }

    void Renderer::drawLine(Vec2 a, Vec2 b, const colors::Color &color)
    {
        SDL_SetRenderDrawColor(m_renderer, color.r, color.g, color.b, color.a);
        SDL_RenderDrawLine(
            m_renderer,
            toScreenX(a.x), toScreenY(a.y),
            toScreenX(b.x), toScreenY(b.y));
    }

    void Renderer::drawDashedLine(Vec2 a, Vec2 b, const colors::Color &color, float dashLength)
    {
        SDL_SetRenderDrawColor(m_renderer, color.r, color.g, color.b, color.a);

        Vec2 dir = b - a;
        float length = dir.magnitude();
        if (length < 0.001f)
            return;

        Vec2 norm = dir / length;
        float traveled = 0.0f;
        bool drawing = true;

        while (traveled < length)
        {
            float segEnd = std::min(traveled + dashLength, length);
            if (drawing)
            {
                Vec2 start = a + norm * traveled;
                Vec2 end = a + norm * segEnd;
                SDL_RenderDrawLine(
                    m_renderer,
                    toScreenX(start.x), toScreenY(start.y),
                    toScreenX(end.x), toScreenY(end.y));
            }
            traveled = segEnd;
            drawing = !drawing;
        }
    }

    void Renderer::drawGlow(Vec2 center, float innerRadius, float outerRadius, const colors::Color &color)
    {
        int steps = 4;
        for (int i = 0; i < steps; i++)
        {
            float t = static_cast<float>(i) / (steps - 1);
            float radius = innerRadius + (outerRadius - innerRadius) * t;
            uint8_t alpha = static_cast<uint8_t>(color.a * (1.0f - t * 0.7f));
            drawCircle(center, radius, colors::Color(color.r, color.g, color.b, alpha));
        }
    }

    void Renderer::drawTrail(const std::vector<Vec2> &trail, const colors::Color &color)
    {
        if (trail.size() < 2)
            return;

        for (size_t i = 1; i < trail.size(); i++)
        {
            float t = static_cast<float>(i) / trail.size();
            uint8_t alpha = static_cast<uint8_t>(color.a * t * t);
            colors::Color fadeColor(color.r, color.g, color.b, alpha);

            SDL_SetRenderDrawColor(m_renderer, fadeColor.r, fadeColor.g, fadeColor.b, fadeColor.a);
            SDL_RenderDrawLine(
                m_renderer,
                toScreenX(trail[i - 1].x), toScreenY(trail[i - 1].y),
                toScreenX(trail[i].x), toScreenY(trail[i].y));
        }
    }

    void Renderer::drawSlingshot(Vec2 anchor, Vec2 current, float maxRadius)
    {
        Vec2 diff = current - anchor;
        float dist = diff.magnitude();

        if (dist < 1.0f)
            return;

        if (dist > maxRadius)
        {
            current = anchor + diff.normalized() * maxRadius;
            dist = maxRadius;
        }

        fillCircle(anchor, 8.0f, colors::entity::SLINGSHOT_ANCHOR);
        drawDashedLine(anchor, current, colors::entity::SLINGSHOT_LINE, 15.0f);

        Vec2 launchDir = (anchor - current).normalized();
        Vec2 indicatorEnd = anchor + launchDir * 60.0f;
        drawLine(anchor, indicatorEnd, colors::entity::SLINGSHOT_LINE);

        float power = dist / maxRadius;
        colors::Color powerColor = colors::entity::SLINGSHOT_LINE.withAlpha(
            static_cast<uint8_t>(100 + 155 * power));
        drawCircle(anchor, 8.0f + power * 20.0f, powerColor);
    }

    void Renderer::present()
    {
        SDL_RenderPresent(m_renderer);
    }

} // namespace slingshot
