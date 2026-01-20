cmake_minimum_required(VERSION 3.20)
project(slingshot VERSION 1.0.0 LANGUAGES CXX)

# C++17 standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Source files (explicit list - add new files here)
set(SOURCES
    src/main.cpp
    src/core/renderer.cpp
    src/physics/world.cpp
    src/game/game.cpp
    src/game/slingshot.cpp
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Emscripten-specific configuration
if(EMSCRIPTEN)
    message(STATUS "Building for WebAssembly with Emscripten")

    # Emscripten compile flags
    target_compile_options(${PROJECT_NAME} PRIVATE
        -sUSE_SDL=2
        -O2
    )

    # Emscripten link flags
    set(EMSCRIPTEN_LINK_FLAGS
        "-sUSE_SDL=2"
        "-sUSE_WEBGL2=1"
        "-sALLOW_MEMORY_GROWTH=1"
        "-sEXPORT_ES6=1"
        "-sMODULARIZE=1"
        "-sEXPORT_NAME='SlingshotModule'"
        "-sENVIRONMENT=web"
        "-sINVOKE_RUN=0"
        "--bind"
        "-O2"
        "--preload-file ${CMAKE_CURRENT_SOURCE_DIR}/levels@/levels"
    )

    # Join flags with spaces
    string(JOIN " " LINK_FLAGS_STRING ${EMSCRIPTEN_LINK_FLAGS})

    set_target_properties(${PROJECT_NAME} PROPERTIES
        SUFFIX ".js"
        LINK_FLAGS "${LINK_FLAGS_STRING}"
    )

    message(STATUS "Output: ${PROJECT_NAME}.js + ${PROJECT_NAME}.wasm + ${PROJECT_NAME}.data")
else()
    message(STATUS "Building native executable (for testing)")

    # Find SDL2 for native build
    find_package(SDL2 REQUIRED)
    target_link_libraries(${PROJECT_NAME} PRIVATE SDL2::SDL2)
endif()
