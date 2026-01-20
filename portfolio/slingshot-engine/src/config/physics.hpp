#ifndef SLINGSHOT_CONFIG_PHYSICS_HPP
#define SLINGSHOT_CONFIG_PHYSICS_HPP

namespace slingshot
{
    namespace physics
    {

        // Gravitational constant (tuned for gameplay feel)
        constexpr float G = 80000.0f;

        // Bounds margin - agent is "lost" if it exceeds world bounds by this much
        constexpr float BOUNDS_MARGIN = 500.0f;

        // Default entity properties by type
        namespace defaults
        {
            // Agent (player projectile)
            constexpr float AGENT_MASS = 2.0f;
            constexpr float AGENT_RADIUS = 18.0f;

            // Goal zone
            constexpr float GOAL_RADIUS = 65.0f;

            // Planet
            constexpr float PLANET_MASS = 250.0f;
            constexpr float PLANET_RADIUS = 60.0f;

            // Sun
            constexpr float SUN_MASS = 500.0f;
            constexpr float SUN_RADIUS = 80.0f;

            // Singularity (black hole)
            constexpr float SINGULARITY_MASS = 2000.0f;
            constexpr float SINGULARITY_RADIUS = 80.0f;

            // Asteroid
            constexpr float ASTEROID_MASS = 20.0f;
            constexpr float ASTEROID_RADIUS = 25.0f;
        }

        // Simulation settings
        constexpr float TIME_STEP = 1.0f / 60.0f;
        constexpr int MAX_TRAIL_POINTS = 100;

    } // namespace physics
} // namespace slingshot

#endif
