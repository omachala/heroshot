#!/bin/sh
# Heroshot installer script
# Usage: curl -fsSL https://heroshot.dev/install.sh | sh
#
# Environment variables:
#   HEROSHOT_INSTALL_DIR - Override install directory (default: ~/.local/bin or /usr/local/bin)
#   HEROSHOT_VERSION     - Install specific version (default: latest)

set -e

REPO="omachala/heroshot"
BINARY_NAME="heroshot"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' BOLD='' NC=''
fi

info() { printf "${BLUE}info${NC}  %s\n" "$1"; }
success() { printf "${GREEN}success${NC}  %s\n" "$1"; }
warn() { printf "${YELLOW}warn${NC}  %s\n" "$1"; }
error() { printf "${RED}error${NC}  %s\n" "$1" >&2; exit 1; }

# Detect OS
detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "darwin" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) error "Unsupported operating system: $(uname -s)" ;;
  esac
}

# Detect architecture
detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64)  echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) error "Unsupported architecture: $(uname -m)" ;;
  esac
}

# Get latest version from GitHub API
get_latest_version() {
  if command -v curl > /dev/null 2>&1; then
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"heroshot@\([^"]*\)".*/\1/'
  elif command -v wget > /dev/null 2>&1; then
    wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"heroshot@\([^"]*\)".*/\1/'
  else
    error "curl or wget is required to download heroshot"
  fi
}

# Download file
download() {
  local url="$1"
  local output="$2"

  if command -v curl > /dev/null 2>&1; then
    curl -fsSL "$url" -o "$output"
  elif command -v wget > /dev/null 2>&1; then
    wget -q "$url" -O "$output"
  fi
}

# Determine install directory
get_install_dir() {
  if [ -n "$HEROSHOT_INSTALL_DIR" ]; then
    echo "$HEROSHOT_INSTALL_DIR"
  elif [ "$(id -u)" = "0" ]; then
    echo "/usr/local/bin"
  elif [ -d "$HOME/.local/bin" ]; then
    echo "$HOME/.local/bin"
  else
    mkdir -p "$HOME/.local/bin"
    echo "$HOME/.local/bin"
  fi
}

# Check if directory is in PATH
check_path() {
  local dir="$1"
  case ":$PATH:" in
    *":$dir:"*) return 0 ;;
    *) return 1 ;;
  esac
}

# Main install logic
main() {
  printf "\n${BOLD}Heroshot Installer${NC}\n\n"

  # Detect platform
  OS=$(detect_os)
  ARCH=$(detect_arch)
  info "Detected platform: ${OS}-${ARCH}"

  # Get version
  VERSION="${HEROSHOT_VERSION:-}"
  if [ -z "$VERSION" ]; then
    info "Fetching latest version..."
    VERSION=$(get_latest_version)
    if [ -z "$VERSION" ]; then
      error "Failed to determine latest version. Set HEROSHOT_VERSION to install a specific version."
    fi
  fi
  info "Version: ${VERSION}"

  # Build download URL
  ASSET_NAME="${BINARY_NAME}-${OS}-${ARCH}"
  if [ "$OS" = "windows" ]; then
    ASSET_NAME="${ASSET_NAME}.exe"
  fi
  DOWNLOAD_URL="https://github.com/${REPO}/releases/download/heroshot%40${VERSION}/${ASSET_NAME}"

  # Download
  INSTALL_DIR=$(get_install_dir)
  TMP_FILE=$(mktemp)
  trap 'rm -f "$TMP_FILE"' EXIT

  info "Downloading ${ASSET_NAME}..."
  download "$DOWNLOAD_URL" "$TMP_FILE" || error "Download failed. Check that version ${VERSION} exists and has binaries for ${OS}-${ARCH}."

  # Install
  mkdir -p "$INSTALL_DIR"
  INSTALL_PATH="${INSTALL_DIR}/${BINARY_NAME}"
  mv "$TMP_FILE" "$INSTALL_PATH"
  chmod +x "$INSTALL_PATH"

  success "Installed heroshot ${VERSION} to ${INSTALL_PATH}"

  # Verify
  if "$INSTALL_PATH" --version > /dev/null 2>&1; then
    INSTALLED_VERSION=$("$INSTALL_PATH" --version)
    success "Verified: heroshot ${INSTALLED_VERSION}"
  else
    warn "Binary installed but verification failed. You may need to install a browser (Chrome/Chromium)."
  fi

  # PATH check
  if ! check_path "$INSTALL_DIR"; then
    printf "\n"
    warn "${INSTALL_DIR} is not in your PATH."
    printf "\n  Add it to your shell config:\n\n"
    printf "    ${BOLD}export PATH=\"%s:\$PATH\"${NC}\n\n" "$INSTALL_DIR"
    printf "  Then restart your shell or run:\n\n"
    printf "    ${BOLD}source ~/.bashrc${NC}  (or ~/.zshrc)\n\n"
  fi

  printf "\n  Get started:\n\n"
  printf "    ${BOLD}heroshot <url>${NC}              # Screenshot any URL\n"
  printf "    ${BOLD}heroshot config${NC}             # Open visual editor\n"
  printf "    ${BOLD}heroshot --help${NC}             # See all commands\n\n"
}

main "$@"
