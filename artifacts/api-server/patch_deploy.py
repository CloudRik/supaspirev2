import sys

with open('/home/ubuntu/deploy.sh', 'r') as f:
    content = f.read()

content = content.replace('BUILD_DIR="/home/ubuntu/app_build"', 'BUILD_DIR="/home/ubuntu/app_builds/$PROJECT_NAME"')

old_clone = '''rm -rf "$BUILD_DIR" 2>/dev/null || sudo rm -rf "$BUILD_DIR"
GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=echo git clone --depth=1 "$CLONE_URL" "$BUILD_DIR" 2>&1 || { echo "Repo clone failed — check the URL is correct, the repository is public, or check your GITHUB_TOKEN settings"; exit 1; }'''

new_clone = '''if [ -d "$BUILD_DIR/.git" ]; then
  echo "Fast-pulling latest changes..."
  cd "$BUILD_DIR"
  GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=echo git fetch origin 2>&1
  DEFAULT_BRANCH=$(git remote show origin | awk '/HEAD branch/ {print $NF}')
  [ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH="main"
  GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=echo git reset --hard origin/$DEFAULT_BRANCH 2>&1 || {
    echo "Git pull failed, falling back to clean clone..."
    cd /home/ubuntu
    rm -rf "$BUILD_DIR"
    GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=echo git clone --depth=1 "$CLONE_URL" "$BUILD_DIR" 2>&1 || { echo "Repo clone failed"; exit 1; }
  }
else
  echo "Cloning repository fresh..."
  rm -rf "$BUILD_DIR" 2>/dev/null || sudo rm -rf "$BUILD_DIR"
  GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=echo git clone --depth=1 "$CLONE_URL" "$BUILD_DIR" 2>&1 || { echo "Repo clone failed"; exit 1; }
fi'''

if old_clone in content:
    content = content.replace(old_clone, new_clone)
    with open('/home/ubuntu/deploy.sh', 'w') as f:
        f.write(content)
    print("Patched successfully!")
else:
    print("Could not find the old clone string. Maybe it's already patched?")
