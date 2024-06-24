(lang dune 3.13)

(name aslp_web)

(generate_opam_files true)

(source
 (github username/reponame))

(authors "Author Name")

(maintainers "Maintainer Name")

(license LICENSE)

(documentation https://url/to/documentation)

(package
 (name aslp_web)
 (synopsis "A short synopsis")
 (description "A longer description")
 (depends ocaml dune asli js_of_ocaml js_of_ocaml-ppx)
 (tags
  (topics "to describe" your project)))

; See the complete stanza docs at https://dune.readthedocs.io/en/stable/dune-files.html#dune-project
