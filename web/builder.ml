let uncachedenv = lazy (
  let env = Option.get @@ LibASL.Arm_env.aarch64_evaluation_environment () in
  (env, !LibASL.Tcheck.env0)
)

let () =
  print_endline "libASL_web heap builder...";

  let open Js_of_ocaml in
  let () = Js.export "libASL_builder"
    (object%js
      method force = Lazy.force uncachedenv
      method marshal (x : Lib.marshal_env) = Lib.marshal x
     end) in
  ()
