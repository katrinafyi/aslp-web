(lang dune 3.14)

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
 (depends
   ocaml ; recommended >= 5.1 for tail-rec-mod-cons of List.map
   dune
   aslp_offline_jsoo
   asli
   (js_of_ocaml (>= 5.9.0)) ; Js_of_ocaml.Typed_array.from_genarray api updated
   js_of_ocaml-ppx
   zarith_stubs_js
  )
 (tags
  (topics "to describe" your project)))

; See the complete stanza docs at https://dune.readthedocs.io/en/stable/dune-files.html#dune-project
