pkg_name=lens-node-build
pkg_origin=holo
pkg_version="0.1.0"
pkg_maintainer="Chris Alfano <chris@jarv.us>"
pkg_license=("MIT")

pkg_deps=(
  jarvus/hologit
  core/git
  core/bash
  core/node
  core/coreutils # TODO: remove
)

pkg_bin_dirs=(bin)


do_build() {
  return 0
}

do_install() {
  build_line "Generating lens script"

  pushd "${pkg_prefix}" > /dev/null
  cat > "bin/lens-tree" <<- EOM
#!$(pkg_path_for bash)/bin/sh

INPUT_TREE="\${1?<input> required}"
NODE_INSTALL="\${HOLOLENS_NODE_INSTALL:-npm install --no-progress --quiet --no-audit}"
NODE_BUILD_ENV="\${HOLOLENS_NODE_BUILD_ENV:-production}"
NODE_BUILD="\${HOLOLENS_NODE_BUILD:-npm run build}"
OUTPUT_DIR="\${HOLOLENS_NODE_OUTPUT_DIR:-dist}"

# redirect all output to stderr
{
  # prepare persistant NPM cache
  mkdir -p /hab/cache/artifacts/studio_cache/npm
  export npm_config_cache="/hab/cache/artifacts/studio_cache/npm"

  # export git tree to disk
  git holo lens export-tree "\${INPUT_TREE}"

  # execute build
  pushd "\${GIT_WORK_TREE}" > /dev/null

  export CI="true"

  echo
  echo "Running: \${NODE_INSTALL}"
  \${NODE_INSTALL}

  echo
  echo "Running: NODE_ENV=\"\${NODE_BUILD_ENV}\" \${NODE_BUILD}"
  NODE_ENV="\${NODE_BUILD_ENV}" \${NODE_BUILD}

  popd > /dev/null

  # add output to git index
  git add "\${OUTPUT_DIR}"
} 2>&1

# output tree hash
git write-tree --prefix="\${OUTPUT_DIR}"

EOM
  chmod +x "bin/lens-tree"
  popd > /dev/null
}

do_strip() {
  return 0
}
