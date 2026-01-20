#ifndef SLINGSHOT_GAME_SLINGSHOT_HPP
#define SLINGSHOT_GAME_SLINGSHOT_HPP

#include "math/vec2.hpp"
#include <functional>

namespace slingshot
{

    class Slingshot
    {
    public:
        using LaunchCallback = std::function<void(Vec2 velocity)>;

        void setAnchor(Vec2 anchor) { m_anchor = anchor; }
        Vec2 getAnchor() const { return m_anchor; }

        void setMaxRadius(float radius) { m_maxRadius = radius; }
        float getMaxRadius() const { return m_maxRadius; }

        void setLaunchMultiplier(float mult) { m_launchMultiplier = mult; }

        void onLaunch(LaunchCallback cb) { m_onLaunch = cb; }

        // Input handling
        void startDrag(Vec2 position);
        void updateDrag(Vec2 position);
        void endDrag();
        void cancelDrag();

        // State
        bool isDragging() const { return m_dragging; }
        Vec2 getDragPosition() const { return m_dragPos; }
        Vec2 getLaunchVelocity() const;
        float getPower() const;

    private:
        Vec2 m_anchor{200, 700};
        Vec2 m_dragPos;
        float m_maxRadius = 100.0f;
        float m_launchMultiplier = 8.0f;
        bool m_dragging = false;

        LaunchCallback m_onLaunch;
    };

} // namespace slingshot

#endif
