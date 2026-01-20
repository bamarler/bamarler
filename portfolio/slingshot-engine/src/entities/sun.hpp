#ifndef SLINGSHOT_ENTITIES_SUN_HPP
#define SLINGSHOT_ENTITIES_SUN_HPP

#include "entities/entity.hpp"
#include "config/physics.hpp"
#include "config/colors.hpp"
#include "core/renderer.hpp"

namespace slingshot
{

    class Sun : public Entity
    {
    public:
        Sun(Vec2 position, bool isPinned = true, std::string entityId = "")
        {
            pos = position;
            mass = physics::defaults::SUN_MASS;
            radius = physics::defaults::SUN_RADIUS;
            pinned = isPinned;
            id = entityId;
        }

        void render(Renderer &r) const override
        {
            r.fillCircle(pos, radius, colors::entity::SUN_CORE);
            r.drawGlow(pos, radius, radius + 25.0f, colors::entity::SUN_GLOW);
        }
    };

} // namespace slingshot

#endif
