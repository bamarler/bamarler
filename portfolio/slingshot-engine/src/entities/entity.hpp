#ifndef SLINGSHOT_ENTITIES_ENTITY_HPP
#define SLINGSHOT_ENTITIES_ENTITY_HPP

#include "math/vec2.hpp"
#include <string>
#include <vector>

namespace slingshot
{

    class Renderer;

    class Entity
    {
    public:
        Vec2 pos;
        Vec2 vel;
        float mass = 0.0f;
        float radius = 0.0f;
        bool pinned = true;
        std::string id;
        std::string orbitsId;

        virtual ~Entity() = default;

        virtual void render(Renderer &renderer) const = 0;
        virtual void update(float dt) {}

        virtual bool exertsGravity() const { return mass > 0.0f; }
        virtual bool isAffectedByGravity() const { return !pinned; }

        bool collidesWith(const Entity &other) const
        {
            float dist = pos.distanceTo(other.pos);
            return dist < radius + other.radius;
        }

        bool contains(Vec2 point) const
        {
            return pos.distanceTo(point) < radius;
        }
    };

} // namespace slingshot

#endif
