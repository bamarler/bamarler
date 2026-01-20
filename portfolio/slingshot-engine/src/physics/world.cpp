#include "physics/world.hpp"
#include "entities/agent.hpp"
#include "entities/goal.hpp"
#include "core/renderer.hpp"
#include "config/physics.hpp"
#include "config/display.hpp"
#include <cmath>
#include <iostream>

namespace slingshot
{

    void PhysicsWorld::addEntity(std::unique_ptr<Entity> entity)
    {
        if (auto *agent = dynamic_cast<Agent *>(entity.get()))
        {
            m_agent = agent;
        }
        else if (auto *goal = dynamic_cast<Goal *>(entity.get()))
        {
            m_goal = goal;
        }
        m_entities.push_back(std::move(entity));
    }

    void PhysicsWorld::clear()
    {
        m_entities.clear();
        m_agent = nullptr;
        m_goal = nullptr;
    }

    Agent *PhysicsWorld::getAgent()
    {
        return m_agent;
    }

    Goal *PhysicsWorld::getGoal()
    {
        return m_goal;
    }

    Entity *PhysicsWorld::getEntityById(const std::string &id)
    {
        for (auto &entity : m_entities)
        {
            if (entity->id == id)
            {
                return entity.get();
            }
        }
        return nullptr;
    }

    void PhysicsWorld::initializeOrbits()
    {
        for (auto &entity : m_entities)
        {
            if (entity->orbitsId.empty() || entity->pinned)
                continue;

            Entity *center = getEntityById(entity->orbitsId);
            if (!center)
            {
                std::cerr << "Orbit target not found: " << entity->orbitsId << std::endl;
                continue;
            }

            bool mutualOrbit = center->orbitsId == entity->id;

            Vec2 toEntity = entity->pos - center->pos;
            float distance = toEntity.magnitude();

            if (distance < 1e-6f)
            {
                std::cerr << "Entities too close for orbit calculation" << std::endl;
                continue;
            }

            if (mutualOrbit)
            {
                float speed = calculateOrbitalSpeed(center->mass, distance);
                Vec2 tangent = toEntity.perpendicular().normalized();
                entity->vel = tangent * speed;

                float centerSpeed = calculateOrbitalSpeed(entity->mass, distance);
                center->vel = -tangent * centerSpeed;
            }
            else
            {
                float speed = calculateOrbitalSpeed(center->mass, distance);
                Vec2 tangent = toEntity.perpendicular().normalized();
                entity->vel = tangent * speed;
            }
        }
    }

    float PhysicsWorld::calculateOrbitalSpeed(float centerMass, float distance) const
    {
        return std::sqrt(physics::G * centerMass / distance);
    }

    Vec2 PhysicsWorld::calculateGravityForce(const Entity &target) const
    {
        Vec2 totalForce(0, 0);

        for (const auto &source : m_entities)
        {
            if (source.get() == &target)
                continue;
            if (!source->exertsGravity())
                continue;

            Vec2 direction = source->pos - target.pos;
            float distSq = direction.magnitudeSquared();

            float minDist = source->radius + target.radius;
            if (distSq < minDist * minDist)
            {
                distSq = minDist * minDist;
            }

            float forceMag = physics::G * source->mass / distSq;
            totalForce += direction.normalized() * forceMag * target.mass;
        }

        return totalForce;
    }

    void PhysicsWorld::update(float dt)
    {
        for (auto &entity : m_entities)
        {
            if (!entity->isAffectedByGravity())
                continue;

            Vec2 force = calculateGravityForce(*entity);
            Vec2 acceleration = force / entity->mass;
            entity->vel += acceleration * dt;
        }

        for (auto &entity : m_entities)
        {
            if (entity->pinned)
                continue;
            entity->pos += entity->vel * dt;
            entity->update(dt);
        }
    }

    bool PhysicsWorld::agentHitGravityWell() const
    {
        if (!m_agent)
            return false;

        for (const auto &entity : m_entities)
        {
            if (entity.get() == m_agent || entity.get() == m_goal)
                continue;
            if (m_agent->collidesWith(*entity))
            {
                return true;
            }
        }
        return false;
    }

    bool PhysicsWorld::agentReachedGoal() const
    {
        if (!m_agent || !m_goal)
            return false;
        return m_goal->contains(m_agent->pos);
    }

    bool PhysicsWorld::agentOutOfBounds() const
    {
        if (!m_agent)
            return false;

        float margin = physics::BOUNDS_MARGIN;
        return m_agent->pos.x < -margin ||
               m_agent->pos.x > display::WORLD_WIDTH + margin ||
               m_agent->pos.y < -margin ||
               m_agent->pos.y > display::WORLD_HEIGHT + margin;
    }

    void PhysicsWorld::render(Renderer &renderer) const
    {
        for (const auto &entity : m_entities)
        {
            entity->render(renderer);
        }
    }

    void PhysicsWorld::removeAgent()
    {
        if (!m_agent)
            return;

        m_entities.erase(
            std::remove_if(m_entities.begin(), m_entities.end(),
                           [this](const std::unique_ptr<Entity> &e)
                           {
                               return e.get() == m_agent;
                           }),
            m_entities.end());
        m_agent = nullptr;
    }

} // namespace slingshot
