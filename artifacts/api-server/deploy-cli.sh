#!/bin/bash

SLUG=$1
PORT=$2
PROJ_DIR=$3

PROJECT_NAME="$SLUG"

[ -z "$SLUG" ] && { echo "Please provide SLUG"; exit 1; }
[ -z "$PORT" ] && PORT=3000
[ -z "$PROJ_DIR" ] && { echo "Please provide PROJ_DIR"; exit 1; }

APP_NAME="app_$(date +%s%3N)"
PERMANENT_DIR="/home/ubuntu/deploys/$APP_NAME"
BUILD_DIR="$PROJ_DIR"

# ─────────────────────────────────────────────────────────────
#  LOAD & EXPORT ENVIRONMENT VARIABLES FOR COMPILATION
# ─────────────────────────────────────────────────────────────
if [ -f "/home/ubuntu/backend/env_vars.json" ]; then
  echo "Loading and exporting environment variables for $PROJECT_NAME..."
  eval "$(python3 -c "
import json, sys
try:
    data = json.load(open('/home/ubuntu/backend/env_vars.json'))
    vs = data.get(sys.argv[1], {})
    for k, v in vs.items():
        if k:
            print(f'export {k}=\"{v}\"')
except: pass
" "$PROJECT_NAME" 2>/dev/null || true)"
fi

echo "Starting Deployment..."
echo "Starting CLI Deployment..."
echo "Port: $PORT"
echo "Container: $APP_NAME"
echo "Node: $(node --version)"

# No clone needed for CLI. Files are already in BUILD_DIR ($PROJ_DIR)
cd "$BUILD_DIR" || exit 1

# ─────────────────────────────────────────────────────────────
#  FRAMEWORK DETECTION
# ─────────────────────────────────────────────────────────────
detect_framework() {
  # User's own Dockerfile → let them handle it
  [ -f "Dockerfile" ] && { echo "dockerfile"; return; }

  # Go
  [ -f "go.mod" ] && { echo "go"; return; }

  # Rust
  [ -f "Cargo.toml" ] && { echo "rust"; return; }

  # PHP
  if [ -f "composer.json" ] || ls *.php 2>/dev/null | head -1 | grep -q .; then
    echo "php"; return
  fi

  # Ruby
  [ -f "Gemfile" ] && { echo "ruby"; return; }

  # Python
  if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ] || [ -f "setup.py" ]; then
    if [ -f "requirements.txt" ] && grep -qiE "fastapi|uvicorn" requirements.txt 2>/dev/null; then
      echo "python-fastapi"; return
    fi
    if [ -f "requirements.txt" ] && grep -qi "django" requirements.txt 2>/dev/null; then
      echo "python-django"; return
    fi
    echo "python-flask"; return
  fi

  # Node.js / JS
  if [ -f "package.json" ]; then
    # pnpm monorepo
    [ -f "pnpm-workspace.yaml" ] || [ -f "pnpm-workspace.yml" ] && { echo "monorepo"; return; }

    # Next.js
    if node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};process.exit(d.next?0:1)" 2>/dev/null; then
      local ncfg=""
      for f in next.config.js next.config.ts next.config.mjs next.config.cjs; do
        [ -f "$f" ] && ncfg="$f" && break
      done
      if [ -n "$ncfg" ] && grep -q "output.*['\"]export['\"]" "$ncfg" 2>/dev/null; then
        echo "nextjs-static"
      else
        echo "nextjs-ssr"
      fi
      return
    fi

    # Vue / Nuxt
    if node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};process.exit(d.nuxt||d['nuxt3']?0:1)" 2>/dev/null; then
      echo "nuxt"; return
    fi

    # Vite-based (React/Vue/Svelte/Solid)
    if node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};process.exit(d.vite?0:1)" 2>/dev/null; then
      echo "vite"; return
    fi

    # Create React App
    if node -e "const p=require('./package.json');process.exit(p.scripts&&(p.scripts.build||'').includes('react-scripts')?0:1)" 2>/dev/null; then
      echo "cra"; return
    fi

    # Has a start script → Node.js server
    if node -e "const p=require('./package.json');process.exit(p.scripts&&(p.scripts.start||p.scripts.dev)?0:1)" 2>/dev/null; then
      # Check if it's likely a backend
      local hasBuild
      hasBuild=$(node -e "const p=require('./package.json');process.stdout.write(p.scripts&&p.scripts.build?'yes':'no')" 2>/dev/null)
      local hasDist=""
      # If build produces static output → static, else server
      echo "nodejs-server"
      return
    fi

    echo "node-static"; return
  fi

  # Plain HTML with no package.json
  [ -f "index.html" ] && { echo "html"; return; }

  echo "unknown"
}

FRAMEWORK=$(detect_framework)
echo ""
echo "╔══════════════════════════════════════════"
echo "║ Framework detected: $FRAMEWORK"
echo "╚══════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────
find_dist() {
  local base="${1:-.}"
  for d in "$base/dist" "$base/.next" "$base/out" "$base/build" "$base/public" "$base/_site" "$base/site"; do
    [ -d "$d" ] && [ "$(ls -A "$d" 2>/dev/null)" ] && { echo "$d"; return 0; }
  done
  return 1
}

patch_ts() {
  local dir=${1:-.}
  [ ! -f "$dir/tsconfig.json" ] && return
  node -e "
    const fs=require('fs');
    try {
      let r=fs.readFileSync('$dir/tsconfig.json','utf-8');
      r=r.replace(/\/\/.*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
      const c=JSON.parse(r);
      c.compilerOptions=Object.assign(c.compilerOptions||{},{
        skipLibCheck:true,noEmit:false,strict:false,
        noUnusedLocals:false,noUnusedParameters:false
      });
      fs.writeFileSync('$dir/tsconfig.json',JSON.stringify(c,null,2));
    }catch(e){}
  " 2>/dev/null
}

patch_vite_base() {
  local f=${1:-./package.json}
  node -e "
    const fs=require('fs');
    try {
      const p=JSON.parse(fs.readFileSync('$f','utf-8'));
      if(p.scripts&&p.scripts.build&&/vite build/.test(p.scripts.build)&&!p.scripts.build.includes('--base')){
        p.scripts.build=p.scripts.build.replace('vite build','vite build --base ./');
        fs.writeFileSync('$f',JSON.stringify(p,null,2));
        console.log('Patched --base ./ into vite build');
      }
    }catch(e){}
  " 2>/dev/null
}

remove_vite_dark_theme() {
  local dir=${1:-.}
  find "$dir" -type f -name "*.css" -exec sed -i 's/background-color: #242424;/background-color: #ffffff;/g' {} + 2>/dev/null || true
  find "$dir" -type f -name "*.css" -exec sed -i 's/color-scheme: light dark;/color-scheme: light;/g' {} + 2>/dev/null || true
}

install_node_deps() {
  local dir=${1:-.}
  cd "$dir" || return 1
  if [ -f "pnpm-lock.yaml" ] || grep -q '"packageManager".*pnpm' package.json 2>/dev/null; then
    PKG_MGR="pnpm"
    pnpm install --frozen-lockfile=false 2>&1 || return 1
  elif [ -f "yarn.lock" ]; then
    PKG_MGR="yarn"
    yarn install --frozen-lockfile 2>&1 || return 1
  else
    PKG_MGR="npm"
    npm install --include=dev 2>&1 || return 1
  fi
  # Fix execute permissions on binaries
  chmod -R +x ./node_modules/.bin/ 2>/dev/null || true
  find ./node_modules -name "*.js" -path "*/bin/*" -exec chmod +x {} \; 2>/dev/null || true
  cd "$BUILD_DIR"
}

# ─────────────────────────────────────────────────────────────
#  BUILD + DEPLOY PER FRAMEWORK
# ─────────────────────────────────────────────────────────────
DEPLOY_MODE="static"   # static | dynamic
DIST_PATH=""
DOCKER_IMAGE=""
DOCKER_CMD=""
DOCKER_EXTRAS=""
CONTAINER_PORT=3000

case "$FRAMEWORK" in

  # ── HTML ──────────────────────────────────────────────────
  html)
    echo "Static HTML site — no build needed"
    DIST_PATH="."
    DEPLOY_MODE="static"
    ;;

  # ── Vite / CRA ────────────────────────────────────────────
  vite|cra|node-static)
    echo "Installing dependencies..."
    install_node_deps "." || { echo "Install failed"; exit 1; }
    patch_ts "."
    patch_vite_base "./package.json"
    remove_vite_dark_theme "."
    echo "Building..."
    chmod -R +x ./node_modules/.bin/ 2>/dev/null || true
    $PKG_MGR run build 2>&1 || { echo "Build failed"; exit 1; }
    DIST_PATH=$(find_dist ".") || { echo "No build output found"; exit 1; }
    DEPLOY_MODE="static"
    ;;

  # ── pnpm monorepo ─────────────────────────────────────────
  monorepo)
    echo "Installing monorepo dependencies..."
    pnpm install --frozen-lockfile=false 2>&1 || { echo "Install failed"; exit 1; }
    FRONTEND_CANDIDATES=
    OTHER_CANDIDATES=
    for sroot in artifacts packages apps src; do
      [ -d "$sroot" ] || continue
      for pdir in "$sroot"/*/; do
        [ -f "${pdir}package.json" ] || continue
        bs=$(node -e "try{process.stdout.write(require('./${pdir}package.json').scripts?.build||'')}catch(e){}" 2>/dev/null)
        [ -z "$bs" ] && continue
        echo "$bs" | grep -qiE 'server.js|node server|express|esbuild' && continue
        pname=$(node -e "try{process.stdout.write(require('./${pdir}package.json').name||'')}catch(e){}" 2>/dev/null)
        echo "$pname" | grep -qiE '-api$|-server$|api-|server-|backend' && continue
        echo "$pname" | grep -qiE 'mockup|sandbox|canvas|preview|storybook' && continue
        echo "$pdir"  | grep -qiE 'mockup|sandbox|canvas|preview|storybook' && continue
        if [ -f "${pdir}vite.config.ts" ] || [ -f "${pdir}vite.config.js" ] || [ -f "${pdir}index.html" ]; then
          FRONTEND_CANDIDATES="$FRONTEND_CANDIDATES ${pdir%/}"
        else
          OTHER_CANDIDATES="$OTHER_CANDIDATES ${pdir%/}"
        fi
      done
    done
    ALL_CANDIDATES="$FRONTEND_CANDIDATES $OTHER_CANDIDATES"
    [ -z "$ALL_CANDIDATES" ] && { echo "No buildable packages in monorepo"; exit 1; }
    echo "Frontend:[$FRONTEND_CANDIDATES] Other:[$OTHER_CANDIDATES]"
    for pdir in $ALL_CANDIDATES; do
      pname=$(node -e "try{process.stdout.write(require('./$pdir/package.json').name||'')}catch(e){}" 2>/dev/null)
      [ -z "$pname" ] && continue
      echo "Building: $pname"
      patch_ts "$pdir"
      patch_vite_base "$pdir/package.json"
      remove_vite_dark_theme "$pdir"
      chmod -R +x ./node_modules/.bin/ 2>/dev/null || true
      BASE_PATH=/ PORT=3000 pnpm --filter "$pname" run build 2>&1 || { echo "Failed $pname, trying next"; continue; }
      DIST_PATH=$(find_dist "$pdir") || true
      [ -n "$DIST_PATH" ] && { echo "Built: $DIST_PATH"; break; }
    done
    [ -z "$DIST_PATH" ] && { echo "All packages failed to build"; exit 1; }
    DEPLOY_MODE="static"
    ;;

  # ── Next.js static export ─────────────────────────────────
  nextjs-static)
    echo "Installing Next.js dependencies..."
    install_node_deps "." || { echo "Install failed"; exit 1; }
    patch_ts "."
    echo "Building Next.js static export..."
    $PKG_MGR run build 2>&1 || { echo "Build failed"; exit 1; }
    DIST_PATH=$(find_dist ".") || { echo "No output found"; exit 1; }
    DEPLOY_MODE="static"
    ;;

  # ── Next.js SSR ───────────────────────────────────────────
  nextjs-ssr)
    echo "Installing Next.js SSR dependencies..."
    install_node_deps "." || { echo "Install failed"; exit 1; }
    patch_ts "."
    echo "Building Next.js SSR..."
    $PKG_MGR run build 2>&1 || { echo "Build failed"; exit 1; }
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="node:22-alpine"
    CONTAINER_PORT=3000
    # Detect start command
    START_CMD=$(node -e "const p=require('./package.json');process.stdout.write(p.scripts?.start||'node_modules/.bin/next start')" 2>/dev/null)
    DOCKER_CMD="sh -c 'PORT=3000 $START_CMD'"
    ;;

  # ── Node.js server ────────────────────────────────────────
  nodejs-server)
    echo "Installing Node.js dependencies..."
    install_node_deps "." || { echo "Install failed"; exit 1; }
    # Run build if it exists
    HAS_BUILD=$(node -e "const p=require('./package.json');process.stdout.write(p.scripts?.build?'yes':'no')" 2>/dev/null)
    if [ "$HAS_BUILD" = "yes" ]; then
      echo "Building..."
      $PKG_MGR run build 2>&1 || true
    fi
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="node:22-alpine"
    CONTAINER_PORT=3000
    # Detect start command
    START_CMD=$(node -e "
      const p=require('./package.json');
      const s=p.scripts||{};
      // Prefer: start > node server.js > node index.js > node app.js
      if(s.start) process.stdout.write(s.start);
      else if(require('fs').existsSync('server.js')) process.stdout.write('node server.js');
      else if(require('fs').existsSync('index.js')) process.stdout.write('node index.js');
      else if(require('fs').existsSync('app.js')) process.stdout.write('node app.js');
      else if(require('fs').existsSync('src/index.js')) process.stdout.write('node src/index.js');
      else process.stdout.write('npm start');
    " 2>/dev/null)
    DOCKER_CMD="sh -c 'PORT=3000 $START_CMD'"
    ;;

  # ── Python Flask ──────────────────────────────────────────
  python-flask)
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="python:3.11-slim"
    CONTAINER_PORT=3000
    # Detect entry point
    ENTRY=""
    for f in app.py main.py server.py wsgi.py run.py; do
      [ -f "$f" ] && { ENTRY="$f"; break; }
    done
    [ -z "$ENTRY" ] && ENTRY=$(find . -maxdepth 2 -name "*.py" | head -1 | sed 's|./||')
    APPMOD=$(echo "$ENTRY" | sed 's|\.py$||' | sed 's|/|.|g')
    if [ -f "requirements.txt" ] && grep -qi "flask" requirements.txt; then
      DOCKER_CMD="sh -c 'pip install -r requirements.txt -q && gunicorn ${APPMOD}:app --bind 0.0.0.0:3000 --workers 2 2>/dev/null || flask run --host=0.0.0.0 --port=3000'"
    else
      DOCKER_CMD="sh -c 'pip install -r requirements.txt -q && python ${ENTRY}'"
    fi
    # Install gunicorn in requirements if not present
    if [ -f "requirements.txt" ] && ! grep -qi "gunicorn" requirements.txt; then
      echo "gunicorn" >> requirements.txt
    fi
    ;;

  # ── Python FastAPI ────────────────────────────────────────
  python-fastapi)
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="python:3.11-slim"
    CONTAINER_PORT=3000
    ENTRY=""
    for f in main.py app.py server.py; do
      [ -f "$f" ] && { ENTRY="$f"; break; }
    done
    [ -z "$ENTRY" ] && ENTRY=$(find . -maxdepth 2 -name "*.py" | head -1 | sed 's|./||')
    APPMOD=$(echo "$ENTRY" | sed 's|\.py$||' | sed 's|/|.|g')
    if [ -f "requirements.txt" ] && ! grep -qi "uvicorn" requirements.txt; then
      echo "uvicorn[standard]" >> requirements.txt
    fi
    DOCKER_CMD="sh -c 'pip install -r requirements.txt -q && uvicorn ${APPMOD}:app --host 0.0.0.0 --port 3000'"
    ;;

  # ── Python Django ─────────────────────────────────────────
  python-django)
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="python:3.11-slim"
    CONTAINER_PORT=3000
    MANAGE=$(find . -name "manage.py" | head -1)
    if [ -f "requirements.txt" ] && ! grep -qi "gunicorn" requirements.txt; then
      echo "gunicorn" >> requirements.txt
    fi
    # Find django wsgi module
    WSGI=$(find . -name "wsgi.py" | head -1 | sed 's|^\./||' | sed 's|/|.|g' | sed 's|\.py$||')
    [ -z "$WSGI" ] && WSGI="app.wsgi"
    DOCKER_CMD="sh -c 'pip install -r requirements.txt -q && python ${MANAGE:-manage.py} migrate --run-syncdb 2>/dev/null; gunicorn ${WSGI}:application --bind 0.0.0.0:3000 --workers 2'"
    ;;

  # ── PHP ───────────────────────────────────────────────────
  php)
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="php:8.2-apache"
    CONTAINER_PORT=80
    # Apache serves from /var/www/html, no start cmd needed
    DOCKER_CMD=""
    ;;

  # ── Go ────────────────────────────────────────────────────
  go)
    echo "Building Go project..."
    # Try to build inside a Go Docker container then run
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="golang:1.21-alpine"
    CONTAINER_PORT=3000
    # Build during docker run (simple approach, no multi-stage)
    MAIN_FILE=$(find . -name "main.go" | head -1 | sed 's|^\./||')
    [ -z "$MAIN_FILE" ] && MAIN_FILE="main.go"
    DOCKER_CMD="sh -c 'go build -o /app/server . && PORT=3000 /app/server'"
    ;;

  # ── Ruby ──────────────────────────────────────────────────
  ruby)
    DEPLOY_MODE="dynamic"
    DOCKER_IMAGE="ruby:3.2-alpine"
    CONTAINER_PORT=3000
    if grep -qi "rails" Gemfile 2>/dev/null; then
      DOCKER_CMD="sh -c 'bundle install -q && rails db:migrate 2>/dev/null; PORT=3000 rails server -b 0.0.0.0'"
    elif [ -f "config.ru" ]; then
      DOCKER_CMD="sh -c 'bundle install -q && rackup config.ru -p 3000 -o 0.0.0.0'"
    else
      DOCKER_CMD="sh -c 'bundle install -q && ruby app.rb'"
    fi
    ;;

  # ── Dockerfile ────────────────────────────────────────────
  dockerfile)
    echo "Building with user Dockerfile..."
    docker build -t "zenith_$APP_NAME" "$BUILD_DIR" 2>&1 || { echo "Docker build failed"; exit 1; }
    docker run -d --memory=200m --memory-swap=200m --cpus=0.5 -p "$PORT":3000 \
      -e PORT=3000 \
      --name "$APP_NAME" "zenith_$APP_NAME" 2>&1 || { echo "Docker run failed"; exit 1; }
    echo ""
    echo "Deployment Complete"
    echo "Container: $APP_NAME"
    echo "Live at: http://3.109.177.105:$PORT"
    exit 0
    ;;

  # ── Nuxt ──────────────────────────────────────────────────
  nuxt)
    echo "Installing Nuxt dependencies..."
    install_node_deps "." || { echo "Install failed"; exit 1; }
    echo "Building Nuxt..."
    $PKG_MGR run build 2>&1 || { echo "Build failed"; exit 1; }
    # Nuxt generates .output for SSR or dist for static
    if [ -d ".output" ] && [ "$(ls -A .output 2>/dev/null)" ]; then
      DEPLOY_MODE="dynamic"
      DOCKER_IMAGE="node:22-alpine"
      CONTAINER_PORT=3000
      DOCKER_CMD="sh -c 'PORT=3000 node .output/server/index.mjs'"
    else
      DIST_PATH=$(find_dist ".") || { echo "No Nuxt output found"; exit 1; }
      DEPLOY_MODE="static"
    fi
    ;;

  *)
    echo "Unknown framework. Attempting generic build..."
    if [ -f "package.json" ]; then
      install_node_deps "." || { echo "Install failed"; exit 1; }
      HAS_BUILD=$(node -e "const p=require('./package.json');process.stdout.write(p.scripts?.build?'yes':'no')" 2>/dev/null)
      if [ "$HAS_BUILD" = "yes" ]; then
        $PKG_MGR run build 2>&1 || true
        DIST_PATH=$(find_dist ".") || true
      fi
      if [ -z "$DIST_PATH" ]; then
        DEPLOY_MODE="dynamic"
        DOCKER_IMAGE="node:22-alpine"
        CONTAINER_PORT=3000
        DOCKER_CMD="sh -c 'PORT=3000 npm start'"
      else
        DEPLOY_MODE="static"
      fi
    else
      echo "Cannot determine how to build this project"
      exit 1
    fi
    ;;
esac

# ─────────────────────────────────────────────────────────────
#  COPY TO PERMANENT STORAGE
# ─────────────────────────────────────────────────────────────
mkdir -p "$PERMANENT_DIR"

if [ "$DEPLOY_MODE" = "static" ]; then
  echo ""
  echo "Copying static build to permanent storage..."
  cp -r "$BUILD_DIR/$DIST_PATH"/. "$PERMANENT_DIR/" 2>/dev/null || \
  cp -r "$BUILD_DIR/." "$PERMANENT_DIR/"
  chmod -R 755 "$PERMANENT_DIR" 2>/dev/null || true

  # Validation: If index.html is missing in the root of static deployment, fail the deployment!
  if [ ! -f "$PERMANENT_DIR/index.html" ]; then
    echo "Error: Static deployment validation failed. index.html not found in the root of build output ($DIST_PATH)."
    echo "Please check if your framework's build output directory is configured correctly."
    # Clean up the created directory to avoid orphaned folders
    rm -rf "$PERMANENT_DIR" 2>/dev/null || true
    exit 1
  fi

elif [ "$DEPLOY_MODE" = "dynamic" ]; then
  echo ""
  echo "Copying app to permanent storage..."
  # Copy everything except node_modules and .git (they'll be installed fresh or already present)
  rsync -a --exclude='.git' --exclude='*.log' "$BUILD_DIR/" "$PERMANENT_DIR/" 2>/dev/null || \
  cp -r "$BUILD_DIR/." "$PERMANENT_DIR/"
  chmod -R 755 "$PERMANENT_DIR" 2>/dev/null || true
fi

# ─────────────────────────────────────────────────────
#  GARBAGE COLLECTION & DISK CLEANUP
# ─────────────────────────────────────────────────────
echo ""
echo "Performing garbage collection..."
# Build dir is the user's permanent project folder, do NOT delete it here.
docker image prune -f 2>/dev/null || true

# ─────────────────────────────────────────────────────
#  LOAD ENV VARS FOR PROJECT
# ─────────────────────────────────────────────────────
ENV_FLAGS=""
if [ -f "/home/ubuntu/backend/env_vars.json" ]; then
  ENV_FLAGS=$(python3 -c "
import json, sys
try:
    data = json.load(open('/home/ubuntu/backend/env_vars.json'))
    vs = data.get(sys.argv[1], {})
    print(' '.join(['-e ' + str(k) + '=' + str(v) for k,v in vs.items() if k]))
except: pass
" "$PROJECT_NAME" 2>/dev/null || true)
fi
# ─────────────────────────────────────────────────────────────
#  RUN DOCKER CONTAINER
# ─────────────────────────────────────────────────────────────
echo ""
echo ""
echo "Stopping any existing container on port $PORT to prevent conflicts..."
docker ps -q --filter publish=$PORT | xargs -r docker stop | xargs -r docker rm

echo "Starting container on port $PORT..."


if [ "$DEPLOY_MODE" = "static" ]; then
  docker run -d --memory=200m --memory-swap=200m --cpus=0.5 -p "$PORT":80 \
    -v "$PERMANENT_DIR":/usr/share/nginx/html:ro \
    -v "/home/ubuntu/backend/nginx_spa.conf":/etc/nginx/conf.d/default.conf:ro \
    --name "$APP_NAME" nginx 2>&1 || { echo "Docker run failed"; exit 1; }

elif [ "$DEPLOY_MODE" = "dynamic" ]; then
  if [ "$CONTAINER_PORT" = "80" ]; then
    # PHP Apache case
    docker run -d --memory=200m --memory-swap=200m --cpus=0.5 -p "$PORT":80 \
      -v "$PERMANENT_DIR":/var/www/html:ro \
      -e PORT=80 \
      --name "$APP_NAME" "$DOCKER_IMAGE" 2>&1 || { echo "Docker run failed"; exit 1; }
  else
    docker run -d --memory=200m --memory-swap=200m --cpus=0.5 -p "$PORT":"$CONTAINER_PORT" \
      -v "$PERMANENT_DIR":/app \
      -w /app \
      -e PORT="$CONTAINER_PORT" \
      -e NODE_ENV=production $ENV_FLAGS \
      --name "$APP_NAME" "$DOCKER_IMAGE" $DOCKER_CMD 2>&1 || { echo "Docker run failed"; exit 1; }
  fi
fi

# Wait for container to start
sleep 2
if ! docker ps --filter "name=$APP_NAME" --filter "status=running" | grep -q "$APP_NAME"; then
  echo "Container failed to start. Logs:"
  docker logs "$APP_NAME" 2>&1 | tail -20
  echo "Container: $APP_NAME"
  exit 1
fi

echo ""
echo "Deployment Complete"
echo "Container: $APP_NAME"
echo "Framework: $FRAMEWORK"
echo "Mode: $DEPLOY_MODE"
echo "Live at: http://3.109.177.105:$PORT"
