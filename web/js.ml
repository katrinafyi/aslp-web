let init input out err =
  Js_of_ocaml.Sys_js.set_channel_flusher stdout out;
  Js_of_ocaml.Sys_js.set_channel_flusher stderr err;
  Js_of_ocaml.Sys_js.set_channel_filler stdin input;
  ()

type tenv = LibASL.Tcheck.GlobalEnv.t
type marshal_env = LibASL.Eval.Env.t * tenv
let cachedenv : marshal_env option ref = ref None
let uncachedenv = lazy (Option.get @@ LibASL.Arm_env.aarch64_evaluation_environment (), !LibASL.Tcheck.env0)


let env () =
  match !cachedenv with
  | Some x -> x
  | None -> Lazy.force uncachedenv

let denv () = LibASL.Dis.build_env @@ fst (env ())

let print_pp = ref true
let pp_stmt () =
  if !print_pp then Asl_utils.pp_stmt else fun x -> Utils.to_string (Asl_parser_pp.pp_raw_stmt x)

let dis (x: string) =
  let (env, tenv) = env () in
  LibASL.Tcheck.env0 := tenv;
  let stmts = LibASL.Dis.retrieveDisassembly env (denv ()) x in
  List.iter
    (fun s -> print_endline @@ pp_stmt () s)
    stmts;
  flush stdout

type js_uint8Array = Js_of_ocaml.Typed_array.uint8Array Js_of_ocaml.Js.t

let marshal (env : marshal_env) : js_uint8Array =
  let bytes = Marshal.to_bytes env [] in
  let len = Bytes.length bytes in
  let array = Bigarray.(Array1.init Int8_unsigned C_layout len (Bytes.get_uint8 bytes)) in
  let genarray = Bigarray.genarray_of_array1 array in
  Js_of_ocaml.Typed_array.from_genarray genarray

let unmarshal (js : js_uint8Array) : marshal_env =
  let genarray = Js_of_ocaml.Typed_array.to_genarray js in
  let array = Bigarray.array1_of_genarray genarray in
  let len = Bigarray.Array1.dim array in
  let bytes = Bytes.init len (fun x -> char_of_int @@ Bigarray.Array1.get array x) in
  Marshal.from_bytes bytes 0

let () =
  print_endline "libASL_web ocaml-side...";

  let open Js_of_ocaml in
  let () = Js.export "libASL_web"
    (object%js
      (* TODO: support stdin from javascript for repl, possibly converting asli repl to lwt *)
      method init (out : string -> unit) (err : string -> unit) = init (fun () -> "") out err

      method force = let _ = env () in ()
      method marshal = marshal (env ())
      method unmarshal (x : js_uint8Array) = (cachedenv := Some (unmarshal x))
      method reset = (cachedenv := None)

      method dis (x: string) = dis x
      method setDebugLevel i = (LibASL.Dis.debug_level := i)
      method setPrettyPrint (x : bool) = (print_pp := x)
     end) in
  ()
