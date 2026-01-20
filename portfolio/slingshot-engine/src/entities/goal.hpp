#ifndef SLINGSHOT_ENTITIES_GOAL_HPP
#define SLINGSHOT_ENTITIES_GOAL_HPP

#include "entities/entity.hpp"
#include "config/physics.hpp"
#include "config/colors.hpp"
#include "core/renderer.hpp"

namespace slingshot
{

    class Goal : public Entity
    {
    public:
        Goal(Vec2 position)
        {
            pos = position;
            mass = 0.0f;
            radius = physics::defaults::GOAL_RADIUS;
            pinned = true;
        }

        void render(Renderer &r) const override
        {
            r.fillCircle(pos, radius, colors::entity::GOAL_FILL);
            r.drawCircle(pos, radius, colors::entity::GOAL_RING);
            r.drawCircle(pos, radius * 0.7f, colors::entity::GOAL_RING.withAlpha(100));
        }

        bool exertsGravity() const override { return false; }
        bool isAffectedByGravity() const override { return false; }
    };

} // namespace slingshot

#endif
