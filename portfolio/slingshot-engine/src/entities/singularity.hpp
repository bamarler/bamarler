#ifndef SLINGSHOT_ENTITIES_SINGULARITY_HPP
#define SLINGSHOT_ENTITIES_SINGULARITY_HPP

#include "entities/entity.hpp"
#include "config/physics.hpp"
#include "config/colors.hpp"
#include "core/renderer.hpp"

namespace slingshot
{

    class Singularity : public Entity
    {
    public:
        Singularity(Vec2 position, bool isPinned = true, std::string entityId = "")
        {
            pos = position;
            mass = physics::defaults::SINGULARITY_MASS;
            radius = physics::defaults::SINGULARITY_RADIUS;
            pinned = isPinned;
            id = entityId;
        }

        void render(Renderer &r) const override
        {
            // Dark center (event horizon)
            r.fillCircle(pos, radius, colors::entity::SINGULARITY_CENTER);
            // Accretion disk - inner bright ring
            r.drawCircle(pos, radius + 3.0f, colors::entity::SINGULARITY_DISK_INNER);
            // Accretion disk - glowing layers
            r.drawGlow(pos, radius + 5.0f, radius + 20.0f, colors::entity::SINGULARITY_DISK_INNER);
            r.drawGlow(pos, radius + 20.0f, radius + 40.0f, colors::entity::SINGULARITY_DISK_OUTER);
        }
    };

} // namespace slingshot

#endif
