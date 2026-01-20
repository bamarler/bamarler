#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/html5.h>
#include <SDL2/SDL.h>

#include <iostream>
#include <string>
#include <memory>
#include <fstream>

#include "config/colors.hpp"
#include "config/display.hpp"
#include "config/physics.hpp"
#include "core/renderer.hpp"
#include "physics/world.hpp"
#include "game/game.hpp"
#include "game/slingshot.hpp"
#include "game/level_loader.hpp"
#include "entities/agent.hpp"
#include "entities/goal.hpp"
#include "entities/planet.hpp"
#include "entities/sun.hpp"
#include "entities/singularity.hpp"
#include "entities/asteroid.hpp"

namespace
{
    using namespace slingshot;

    bool g_initialized = false;
    SDL_Window *g_window = nullptr;
    SDL_Renderer *g_sdlRenderer = nullptr;

    int g_canvasWidth = 0;
    int g_canvasHeight = 0;
    float g_scale = 1.0f;
    float g_offsetX = 0.0f;
    float g_offsetY = 0.0f;
    bool g_needsLandscape = false;
    int g_totalLevels = 0;

    Renderer g_renderer;
    PhysicsWorld g_world;
    Game g_game;
    Slingshot g_slingshot;

    Vec2 g_spawnPos{200, 700};
}

int countLevelFiles()
{
    int count = 0;
    for (int i = 1; i <= 100; ++i)
    {
        std::string path = "/levels/level_" +
            std::string(i < 10 ? "0" : "") +
            std::to_string(i) + ".json";
        std::ifstream file(path);
        if (file.good())
        {
            count++;
        }
        else
        {
            break;
        }
    }
    return count;
}

Vec2 screenToWorld(int screenX, int screenY)
{
    return Vec2(
        (screenX - g_offsetX) / g_scale,
        (screenY - g_offsetY) / g_scale);
}

void updateCanvasSize()
{
    double cssWidth, cssHeight;
    emscripten_get_element_css_size("#canvas", &cssWidth, &cssHeight);

    g_canvasWidth = static_cast<int>(cssWidth);
    g_canvasHeight = static_cast<int>(cssHeight);

    g_needsLandscape = g_canvasWidth < display::LANDSCAPE_THRESHOLD &&
                       g_canvasWidth < g_canvasHeight;

    float scaleX = g_canvasWidth / display::WORLD_WIDTH;
    float scaleY = g_canvasHeight / display::WORLD_HEIGHT;
    g_scale = std::min(scaleX, scaleY);

    float scaledWidth = display::WORLD_WIDTH * g_scale;
    float scaledHeight = display::WORLD_HEIGHT * g_scale;
    g_offsetX = (g_canvasWidth - scaledWidth) / 2.0f;
    g_offsetY = (g_canvasHeight - scaledHeight) / 2.0f;

    g_renderer.setScale(g_scale, g_offsetX, g_offsetY);

    if (g_window)
    {
        SDL_SetWindowSize(g_window, g_canvasWidth, g_canvasHeight);
    }
}

EM_BOOL onCanvasResize(int eventType, const EmscriptenUiEvent *uiEvent, void *userData)
{
    updateCanvasSize();
    return EM_TRUE;
}

void spawnAgent()
{
    auto agent = std::make_unique<Agent>(g_spawnPos);
    g_world.addEntity(std::move(agent));
}

void loadLevel(int levelId)
{
    g_world.clear();
    g_game.setLevel(levelId);
    g_game.resetAttempts();

    std::string path = "/levels/level_" +
        std::string(levelId < 10 ? "0" : "") +
        std::to_string(levelId) + ".json";

    LevelData levelData;
    if (LevelLoader::load(path, g_world, levelData))
    {
        g_spawnPos = levelData.spawn;
        std::cout << "Loaded level: " << levelData.name << std::endl;
    }
    else
    {
        std::cerr << "Failed to load level from " << path << std::endl;
        g_spawnPos = Vec2(200, 700);
        g_world.addEntity(std::make_unique<Goal>(Vec2(1400, 150)));
        g_world.addEntity(std::make_unique<Planet>(Vec2(800, 450), true, ""));
    }

    g_slingshot.setAnchor(g_spawnPos);
    g_game.setState(GameState::Rules);
}

void launchAgent(Vec2 velocity)
{
    spawnAgent();

    if (auto *agent = g_world.getAgent())
    {
        agent->vel = velocity;
    }

    g_game.incrementAttempts();
    g_game.setState(GameState::Launched);
}

void resetForRetry()
{
    // Remove current agent
    g_world.removeAgent();

    // Reset slingshot
    g_slingshot.setAnchor(g_spawnPos);
    g_slingshot.cancelDrag();

    g_game.setState(GameState::Aiming);
}

bool initSDL()
{
    if (SDL_Init(SDL_INIT_VIDEO) < 0)
    {
        std::cerr << "SDL initialization failed: " << SDL_GetError() << std::endl;
        return false;
    }

    SDL_SetHint(SDL_HINT_EMSCRIPTEN_KEYBOARD_ELEMENT, "#canvas");

    updateCanvasSize();

    g_window = SDL_CreateWindow(
        "Slingshot",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        g_canvasWidth,
        g_canvasHeight,
        SDL_WINDOW_SHOWN);

    if (!g_window)
    {
        std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
        return false;
    }

    g_sdlRenderer = SDL_CreateRenderer(
        g_window,
        -1,
        SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);

    if (!g_sdlRenderer)
    {
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        return false;
    }

    g_renderer.init(g_sdlRenderer);
    g_renderer.setScale(g_scale, g_offsetX, g_offsetY);

    emscripten_set_resize_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, EM_FALSE, onCanvasResize);

    return true;
}

void handleInput()
{
    SDL_Event event;
    while (SDL_PollEvent(&event))
    {
        switch (event.type)
        {
        case SDL_QUIT:
            emscripten_cancel_main_loop();
            break;

        case SDL_MOUSEBUTTONDOWN:
            if (event.button.button == SDL_BUTTON_LEFT)
            {
                Vec2 worldPos = screenToWorld(event.button.x, event.button.y);

                if (g_game.getState() == GameState::Rules)
                {
                    g_game.setState(GameState::Aiming);
                }
                else if (g_game.getState() == GameState::Aiming)
                {
                    float grabRadius = 50.0f;
                    if (worldPos.distanceTo(g_slingshot.getAnchor()) < grabRadius)
                    {
                        g_slingshot.startDrag(worldPos);
                    }
                }
                else if (g_game.getState() == GameState::Won ||
                         g_game.getState() == GameState::Lost)
                {
                    resetForRetry();
                }
            }
            break;

        case SDL_MOUSEMOTION:
            if (g_game.getState() == GameState::Aiming && g_slingshot.isDragging())
            {
                Vec2 worldPos = screenToWorld(event.motion.x, event.motion.y);
                g_slingshot.updateDrag(worldPos);
            }
            break;

        case SDL_MOUSEBUTTONUP:
            if (event.button.button == SDL_BUTTON_LEFT)
            {
                if (g_game.getState() == GameState::Aiming && g_slingshot.isDragging())
                {
                    Vec2 velocity = g_slingshot.getLaunchVelocity();
                    g_slingshot.cancelDrag();

                    if (velocity.magnitude() > 10.0f)
                    {
                        launchAgent(velocity);
                    }
                }
            }
            break;
        }
    }
}

void update()
{
    if (g_game.getState() == GameState::Launched)
    {
        g_world.update(physics::TIME_STEP);

        if (g_world.agentReachedGoal())
        {
            g_game.triggerWin();
        }
        else if (g_world.agentHitGravityWell())
        {
            g_game.triggerLose(LoseReason::HitGravityWell);
        }
        else if (g_world.agentOutOfBounds())
        {
            g_game.triggerLose(LoseReason::OutOfBounds);
        }
    }
    else if (g_game.getState() == GameState::Aiming)
    {
        // Update orbiting entities even when not launched
        g_world.update(physics::TIME_STEP);
    }
}

void render()
{
    g_renderer.clear(colors::BG_DARK);

    if (g_needsLandscape)
    {
        g_renderer.fillCircle(
            Vec2(display::WORLD_WIDTH / 2, display::WORLD_HEIGHT / 2),
            100.0f,
            colors::BG_SURFACE);
        g_renderer.present();
        return;
    }

    // Render world entities
    g_world.render(g_renderer);

    // Render slingshot when aiming
    if (g_game.getState() == GameState::Aiming)
    {
        if (g_slingshot.isDragging())
        {
            g_renderer.drawSlingshot(
                g_slingshot.getAnchor(),
                g_slingshot.getDragPosition(),
                g_slingshot.getMaxRadius());
        }
        else
        {
            // Show anchor point when not dragging
            g_renderer.fillCircle(g_slingshot.getAnchor(), 8.0f, colors::entity::SLINGSHOT_ANCHOR);
        }
    }

    g_renderer.present();
}

void mainLoop()
{
    handleInput();
    update();
    render();
}

// JS API functions
void startGame()
{
    if (!g_initialized)
    {
        if (!initSDL())
        {
            std::cerr << "Failed to initialize game" << std::endl;
            return;
        }

        g_slingshot.onLaunch([](Vec2 vel)
                             {
                                 // Callback when slingshot releases (not used directly now)
                             });

        g_game.onWin([](int levelId, int attempts)
                     {
            std::cout << "Level " << levelId << " complete in " << attempts << " attempts!" << std::endl;
            EM_ASM({
                if (window.onSlingshotWin) {
                    window.onSlingshotWin($0, $1);
                }
            }, levelId, attempts); });

        g_game.onLose([]()
                      {
            std::cout << "Lost! Reason: " << static_cast<int>(g_game.getLoseReason()) << std::endl;
            EM_ASM({
                if (window.onSlingshotLose) {
                    window.onSlingshotLose();
                }
            }); });

        g_totalLevels = countLevelFiles();
        g_initialized = true;
        loadLevel(1);
        std::cout << "Slingshot game initialized! Found " << g_totalLevels << " levels." << std::endl;
    }

    emscripten_set_main_loop(mainLoop, 0, 0);
}

void resetGame()
{
    loadLevel(g_game.getLevel());
}

void setLevel(int levelId)
{
    loadLevel(levelId);
}

int getAttempts()
{
    return g_game.getAttempts();
}

int getCurrentLevel()
{
    return g_game.getLevel();
}

int getGameState()
{
    return static_cast<int>(g_game.getState());
}

std::string getVersion()
{
    return "0.2.0";
}

bool needsLandscape()
{
    return g_needsLandscape;
}

void dismissRules()
{
    if (g_game.getState() == GameState::Rules)
    {
        g_game.setState(GameState::Aiming);
    }
}

void retryLevel()
{
    g_world.removeAgent();
    g_slingshot.setAnchor(g_spawnPos);
    g_slingshot.cancelDrag();
    g_game.setState(GameState::Aiming);
}

int getTotalLevels()
{
    return g_totalLevels;
}

EMSCRIPTEN_BINDINGS(slingshot)
{
    emscripten::function("startGame", &startGame);
    emscripten::function("resetGame", &resetGame);
    emscripten::function("retryLevel", &retryLevel);
    emscripten::function("setLevel", &setLevel);
    emscripten::function("getAttempts", &getAttempts);
    emscripten::function("getCurrentLevel", &getCurrentLevel);
    emscripten::function("getGameState", &getGameState);
    emscripten::function("getVersion", &getVersion);
    emscripten::function("needsLandscape", &needsLandscape);
    emscripten::function("dismissRules", &dismissRules);
    emscripten::function("getTotalLevels", &getTotalLevels);
}
