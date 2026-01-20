#ifndef SLINGSHOT_ENTITIES_ASTEROID_HPP
#define SLINGSHOT_ENTITIES_ASTEROID_HPP

#include "entities/entity.hpp"
#include "config/physics.hpp"
#include "config/colors.hpp"
#include "core/renderer.hpp"

namespace slingshot
{

    class Asteroid : public Entity
    {
    public:
        Asteroid(Vec2 position, bool isPinned = true, std::string entityId = "")
        {
            pos = position;
            mass = physics::defaults::ASTEROID_MASS;
            radius = physics::defaults::ASTEROID_RADIUS;
            pinned = isPinned;
            id = entityId;
        }

        void render(Renderer &r) const override
        {
            r.fillCircle(pos, radius, colors::entity::ASTEROID_FILL);
            r.drawCircle(pos, radius, colors::entity::ASTEROID_STROKE);
        }
    };

} // namespace slingshot

#endif
