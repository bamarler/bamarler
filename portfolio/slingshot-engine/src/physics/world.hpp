#ifndef SLINGSHOT_PHYSICS_WORLD_HPP
#define SLINGSHOT_PHYSICS_WORLD_HPP

#include <vector>
#include <memory>
#include <string>
#include "entities/entity.hpp"
#include "math/vec2.hpp"

namespace slingshot
{

    class Agent;
    class Goal;
    class Renderer;

    class PhysicsWorld
    {
    public:
        PhysicsWorld() = default;

        void addEntity(std::unique_ptr<Entity> entity);
        void clear();

        void initializeOrbits();
        void update(float dt);

        Agent *getAgent();
        Goal *getGoal();
        Entity *getEntityById(const std::string &id);
        const std::vector<std::unique_ptr<Entity>> &getEntities() const { return m_entities; }

        bool agentHitGravityWell() const;
        bool agentReachedGoal() const;
        bool agentOutOfBounds() const;

        void render(Renderer &renderer) const;

        void removeAgent();

    private:
        Vec2 calculateGravityForce(const Entity &target) const;
        float calculateOrbitalSpeed(float centerMass, float distance) const;

        std::vector<std::unique_ptr<Entity>> m_entities;
        Agent *m_agent = nullptr;
        Goal *m_goal = nullptr;
    };

} // namespace slingshot

#endif
