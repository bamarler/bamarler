#include "game/slingshot.hpp"
#include <algorithm>

namespace slingshot
{

    void Slingshot::startDrag(Vec2 position)
    {
        m_dragging = true;
        m_dragPos = position;
    }

    void Slingshot::updateDrag(Vec2 position)
    {
        if (!m_dragging)
            return;

        Vec2 diff = position - m_anchor;
        float dist = diff.magnitude();

        // Clamp to max radius
        if (dist > m_maxRadius)
        {
            m_dragPos = m_anchor + diff.normalized() * m_maxRadius;
        }
        else
        {
            m_dragPos = position;
        }
    }

    void Slingshot::endDrag()
    {
        if (!m_dragging)
            return;

        m_dragging = false;
        Vec2 velocity = getLaunchVelocity();

        if (velocity.magnitude() > 1.0f && m_onLaunch)
        {
            m_onLaunch(velocity);
        }
    }

    void Slingshot::cancelDrag()
    {
        m_dragging = false;
        m_dragPos = m_anchor;
    }

    Vec2 Slingshot::getLaunchVelocity() const
    {
        // Launch in opposite direction of drag
        Vec2 pull = m_anchor - m_dragPos;
        return pull * m_launchMultiplier;
    }

    float Slingshot::getPower() const
    {
        Vec2 diff = m_dragPos - m_anchor;
        return std::min(diff.magnitude() / m_maxRadius, 1.0f);
    }

} // namespace slingshot
