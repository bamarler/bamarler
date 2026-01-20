SHELL := /bin/bash
.DEFAULT_GOAL := help

# Directories
ENGINE_DIR := slingshot-engine
BUILD_DIR := $(ENGINE_DIR)/build
WASM_OUTPUT := public/wasm
EMSDK_ENV := $(HOME)/emsdk/emsdk_env.sh

# Colors for output
GREEN := \033[0;32m
RED := \033[0;31m
BLUE := \033[0;34m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Check mark and X
CHECK := $(GREEN)✓$(NC)
CROSS := $(RED)✗$(NC)

.PHONY: help check-deps init build clean dev up watch

## help: Show this help message
help:
	@echo ""
	@echo "$(BLUE)Slingshot Game - Development Commands$(NC)"
	@echo "========================================"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | column -t -s ':'
	@echo ""

## check-deps: Verify all required tools are installed
check-deps:
	@echo ""
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@echo ""
	@command -v cmake >/dev/null 2>&1 && echo "  $(CHECK) cmake: $$(cmake --version | head -1)" || echo "  $(CROSS) cmake: not found"
	@command -v ninja >/dev/null 2>&1 && echo "  $(CHECK) ninja: $$(ninja --version)" || echo "  $(CROSS) ninja: not found"
	@command -v bun >/dev/null 2>&1 && echo "  $(CHECK) bun: $$(bun --version)" || echo "  $(CROSS) bun: not found"
	@if [ -f "$(EMSDK_ENV)" ]; then \
		source $(EMSDK_ENV) 2>/dev/null && \
		command -v emcc >/dev/null 2>&1 && echo "  $(CHECK) emcc: $$(emcc --version | head -1 | cut -d' ' -f2-4)" || echo "  $(CROSS) emcc: not found (run: source ~/emsdk/emsdk_env.sh)"; \
	else \
		echo "  $(CROSS) emsdk: not found at $(EMSDK_ENV)"; \
	fi
	@echo ""

## init: First-time setup - configure CMake build
init: check-deps
	@echo "$(BLUE)Initializing build system...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@mkdir -p $(WASM_OUTPUT)
	@source $(EMSDK_ENV) 2>/dev/null && \
		cd $(BUILD_DIR) && \
		emcmake cmake .. -G Ninja
	@echo ""
	@echo "$(GREEN)Build system initialized!$(NC)"
	@echo "Run 'make build' to compile."

## build: Compile C++ to WebAssembly
build:
	@echo "$(BLUE)Building WebAssembly...$(NC)"
	@if [ ! -d "$(BUILD_DIR)" ]; then \
		echo "$(RED)Build directory not found. Run 'make init' first.$(NC)"; \
		exit 1; \
	fi
	@source $(EMSDK_ENV) 2>/dev/null && \
		cd $(BUILD_DIR) && \
		ninja
	@echo ""
	@echo "$(BLUE)Copying to $(WASM_OUTPUT)/...$(NC)"
	@cp $(BUILD_DIR)/slingshot.js $(WASM_OUTPUT)/ 2>/dev/null || true
	@cp $(BUILD_DIR)/slingshot.wasm $(WASM_OUTPUT)/ 2>/dev/null || true
	@cp $(BUILD_DIR)/slingshot.data $(WASM_OUTPUT)/ 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)Build complete!$(NC)"
	@ls -lh $(WASM_OUTPUT)/slingshot.* 2>/dev/null || echo "$(YELLOW)No output files yet$(NC)"

## clean: Remove build artifacts
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@rm -rf $(BUILD_DIR)
	@rm -f $(WASM_OUTPUT)/slingshot.*
	@echo "$(GREEN)Clean complete!$(NC)"

## dev: Start Next.js development server
dev:
	@echo "$(BLUE)Starting Next.js dev server...$(NC)"
	@echo ""
	@bun dev

## up: Build WASM and start dev server
up: build
	@echo ""
	@echo "$(BLUE)Starting development environment...$(NC)"
	@echo ""
	@echo "$(GREEN)Game available at: http://localhost:3000/slingshot$(NC)"
	@echo ""
	@bun dev

## rebuild: Clean and rebuild everything
rebuild: clean init build
	@echo "$(GREEN)Full rebuild complete!$(NC)"
