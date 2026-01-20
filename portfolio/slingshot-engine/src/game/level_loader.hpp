#ifndef SLINGSHOT_GAME_LEVEL_LOADER_HPP
#define SLINGSHOT_GAME_LEVEL_LOADER_HPP

#include "lib/json.hpp"
#include "math/vec2.hpp"
#include "physics/world.hpp"
#include "entities/planet.hpp"
#include "entities/sun.hpp"
#include "entities/singularity.hpp"
#include "entities/asteroid.hpp"
#include "entities/goal.hpp"

#include <fstream>
#include <string>
#include <memory>

namespace slingshot
{

    using json = nlohmann::json;

    struct LevelData
    {
        int id = 0;
        std::string name;
        bool tutorial = false;
        Vec2 spawn;
        Vec2 goal;
    };

    class LevelLoader
    {
    public:
        static bool load(const std::string &path, PhysicsWorld &world, LevelData &data)
        {
            std::ifstream file(path);
            if (!file.is_open())
            {
                return false;
            }

            json j;
            try
            {
                file >> j;
            }
            catch (const json::parse_error &e)
            {
                return false;
            }

            data.id = j.value("id", 0);
            data.name = j.value("name", "");
            data.tutorial = j.value("tutorial", false);

            if (j.contains("spawn") && j["spawn"].is_array() && j["spawn"].size() >= 2)
            {
                data.spawn = Vec2(j["spawn"][0].get<float>(), j["spawn"][1].get<float>());
            }

            if (j.contains("goal") && j["goal"].is_array() && j["goal"].size() >= 2)
            {
                data.goal = Vec2(j["goal"][0].get<float>(), j["goal"][1].get<float>());
                world.addEntity(std::make_unique<Goal>(data.goal));
            }

            if (j.contains("entities") && j["entities"].is_array())
            {
                for (const auto &ent : j["entities"])
                {
                    auto entity = createEntity(ent);
                    if (entity)
                    {
                        world.addEntity(std::move(entity));
                    }
                }
            }

            world.initializeOrbits();
            return true;
        }

    private:
        static std::unique_ptr<Entity> createEntity(const json &j)
        {
            std::string type = j.value("type", "");
            if (type.empty())
                return nullptr;

            Vec2 pos(0, 0);
            if (j.contains("pos") && j["pos"].is_array() && j["pos"].size() >= 2)
            {
                pos = Vec2(j["pos"][0].get<float>(), j["pos"][1].get<float>());
            }

            bool pinned = j.value("pinned", true);
            std::string id = j.value("id", "");
            std::string orbits = j.value("orbits", "");

            std::unique_ptr<Entity> entity;

            if (type == "planet")
            {
                entity = std::make_unique<Planet>(pos, pinned, id);
            }
            else if (type == "sun")
            {
                entity = std::make_unique<Sun>(pos, pinned, id);
            }
            else if (type == "singularity")
            {
                entity = std::make_unique<Singularity>(pos, pinned, id);
            }
            else if (type == "asteroid")
            {
                entity = std::make_unique<Asteroid>(pos, pinned, id);
            }

            if (entity && !orbits.empty())
            {
                entity->orbitsId = orbits;
            }

            return entity;
        }
    };

} // namespace slingshot

#endif
