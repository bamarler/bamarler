#ifndef SLINGSHOT_ENTITIES_PLANET_HPP
#define SLINGSHOT_ENTITIES_PLANET_HPP

#include "entities/entity.hpp"
#include "config/physics.hpp"
#include "config/colors.hpp"
#include "core/renderer.hpp"

namespace slingshot
{

    class Planet : public Entity
    {
    public:
        Planet(Vec2 position, bool isPinned = true, std::string entityId = "")
        {
            pos = position;
            mass = physics::defaults::PLANET_MASS;
            radius = physics::defaults::PLANET_RADIUS;
            pinned = isPinned;
            id = entityId;
        }

        void render(Renderer &r) const override
        {
            r.fillCircle(pos, radius, colors::entity::PLANET_FILL);
            r.drawGlow(pos, radius, radius + 12.0f, colors::entity::PLANET_GLOW);
        }
    };

} // namespace slingshot

#endif
