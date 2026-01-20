#ifndef SLINGSHOT_PHYSICS_BODY_HPP
#define SLINGSHOT_PHYSICS_BODY_HPP

#include <string>
#include "math/vec2.hpp"
#include "config/physics.hpp"

namespace slingshot
{

    enum class EntityType
    {
        Agent,
        Goal,
        Planet,
        Sun,
        Singularity,
        Asteroid
    };

    struct Body
    {
        Vec2 pos;
        Vec2 vel;
        float mass;
        float radius;
        bool pinned;
        EntityType type;
        std::string id;       // Optional ID for orbit references
        std::string orbitsId; // ID of body this orbits (empty if none)

        Body() = default;

        Body(EntityType type_, Vec2 pos_, bool pinned_ = true, std::string id_ = "")
            : pos(pos_), vel(0, 0), pinned(pinned_), type(type_), id(id_)
        {
            setDefaultsForType(type_);
        }

        void setDefaultsForType(EntityType t)
        {
            using namespace physics::defaults;
            switch (t)
            {
            case EntityType::Agent:
                mass = AGENT_MASS;
                radius = AGENT_RADIUS;
                break;
            case EntityType::Goal:
                mass = 0.0f;
                radius = GOAL_RADIUS;
                break;
            case EntityType::Planet:
                mass = PLANET_MASS;
                radius = PLANET_RADIUS;
                break;
            case EntityType::Sun:
                mass = SUN_MASS;
                radius = SUN_RADIUS;
                break;
            case EntityType::Singularity:
                mass = SINGULARITY_MASS;
                radius = SINGULARITY_RADIUS;
                break;
            case EntityType::Asteroid:
                mass = ASTEROID_MASS;
                radius = ASTEROID_RADIUS;
                break;
            }
        }

        bool exertsGravity() const
        {
            // Agent doesn't pull other bodies (design choice for playability)
            return type != EntityType::Agent && type != EntityType::Goal && mass > 0.0f;
        }

        bool isAffectedByGravity() const
        {
            return !pinned && type != EntityType::Goal;
        }
    };

} // namespace slingshot

#endif
