#include "game/game.hpp"

namespace slingshot
{

    void Game::setState(GameState state)
    {
        m_state = state;
        if (m_onStateChange)
        {
            m_onStateChange(state);
        }
    }

    void Game::triggerWin()
    {
        setState(GameState::Won);
        if (m_onWin)
        {
            m_onWin(m_levelId, m_attempts);
        }
    }

    void Game::triggerLose(LoseReason reason)
    {
        m_loseReason = reason;
        setState(GameState::Lost);
        if (m_onLose)
        {
            m_onLose();
        }
    }

} // namespace slingshot
