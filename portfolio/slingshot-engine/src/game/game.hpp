#ifndef SLINGSHOT_GAME_GAME_HPP
#define SLINGSHOT_GAME_GAME_HPP

#include <functional>

namespace slingshot
{

    enum class GameState
    {
        Rules,    // Showing rules before play
        Aiming,   // Player can drag slingshot
        Launched, // Physics running
        Won,      // Reached goal
        Lost      // Hit gravity well or out of bounds
    };

    enum class LoseReason
    {
        None,
        HitGravityWell,
        OutOfBounds
    };

    class Game
    {
    public:
        using VoidCallback = std::function<void()>;
        using WinCallback = std::function<void(int levelId, int attempts)>;

        void setState(GameState state);
        GameState getState() const { return m_state; }

        void setLevel(int levelId) { m_levelId = levelId; }
        int getLevel() const { return m_levelId; }

        void incrementAttempts() { m_attempts++; }
        int getAttempts() const { return m_attempts; }
        void resetAttempts() { m_attempts = 0; }

        void setLoseReason(LoseReason reason) { m_loseReason = reason; }
        LoseReason getLoseReason() const { return m_loseReason; }

        void onWin(WinCallback cb) { m_onWin = cb; }
        void onLose(VoidCallback cb) { m_onLose = cb; }
        void onStateChange(std::function<void(GameState)> cb) { m_onStateChange = cb; }

        void triggerWin();
        void triggerLose(LoseReason reason);

    private:
        GameState m_state = GameState::Rules;
        int m_levelId = 1;
        int m_attempts = 0;
        LoseReason m_loseReason = LoseReason::None;

        WinCallback m_onWin;
        VoidCallback m_onLose;
        std::function<void(GameState)> m_onStateChange;
    };

} // namespace slingshot

#endif
