#ifndef SLINGSHOT_ENTITIES_AGENT_HPP
#define SLINGSHOT_ENTITIES_AGENT_HPP

#include "entities/entity.hpp"
#include "config/physics.hpp"
#include "config/colors.hpp"
#include "core/renderer.hpp"
#include <vector>

namespace slingshot
{

    class Agent : public Entity
    {
    public:
        std::vector<Vec2> trail;

        Agent(Vec2 position)
        {
            pos = position;
            mass = physics::defaults::AGENT_MASS;
            radius = physics::defaults::AGENT_RADIUS;
            pinned = false;
        }

        void update(float dt) override
        {
            trail.push_back(pos);
            if (trail.size() > physics::MAX_TRAIL_POINTS)
            {
                trail.erase(trail.begin());
            }
        }

        void render(Renderer &r) const override
        {
            r.drawTrail(trail, colors::entity::AGENT_TRAIL);
            r.fillCircle(pos, radius, colors::entity::AGENT);
            r.drawCircle(pos, radius, colors::entity::AGENT.withAlpha(200));
        }

        bool exertsGravity() const override { return false; }

        void clearTrail() { trail.clear(); }
    };

} // namespace slingshot

#endif
