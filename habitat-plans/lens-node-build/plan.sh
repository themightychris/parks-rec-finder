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
NODE_ENV="\${HOLOLENS_NODE_ENV:-production}"
NODE_INSTALL="\${HOLOLENS_NODE_INSTALL:-npm install --no-progress --quiet --production --no-audit}"
NODE_BUILD="\${HOLOLENS_NODE_BUILD:-npm run build}"

# redirect all output to stderr
#{
  # export git tree to disk
  git holo lens export-tree "\${INPUT_TREE}"

  # execute compilation
  pushd "\${GIT_WORK_TREE}" > /dev/null
  export NODE_ENV
  \${NODE_INSTALL}
  \${NODE_BUILD}
  popd > /dev/null

  # add output to git index
  git add dist
#} 1>&2

# output tree hash
git write-tree --prefix=dist

EOM
  chmod +x "bin/lens-tree"
  popd > /dev/null
}

do_strip() {
  return 0
}
