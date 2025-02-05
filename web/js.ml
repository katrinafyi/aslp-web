let init input out err =
  Js_of_ocaml.Sys_js.set_channel_flusher stdout out;
  Js_of_ocaml.Sys_js.set_channel_flusher stderr err;
  Js_of_ocaml.Sys_js.set_channel_filler stdin input;
  ()

let () = Printexc.record_backtrace true
let cachedenv : Lib.marshal_env option ref = ref None
let uncachedenv = lazy (failwith "unable to initialize disassembly environment")

let env () =
  match !cachedenv with
  | Some x -> x
  | None -> Lazy.force uncachedenv

let denv () = LibASL.Dis.build_env @@ fst (env ())

let print_pp = ref true
let pp_stmt () =
  let open LibASL in
  if !print_pp then Asl_utils.pp_stmt else fun x -> Utils.to_string (Asl_parser_pp.pp_raw_stmt x)

let dis (x: string) =
  let (env, tenv) = env () in
  LibASL.Tcheck.env0 := tenv;
  let stmts = LibASL.Dis.retrieveDisassembly env (denv ()) x in
  List.iter
    (fun s -> print_endline @@ pp_stmt () s)
    stmts;
  flush stdout

let () =
  print_endline "libASL_web ocaml-side...";

  let open Js_of_ocaml in
  let () = Js.export "libASL_web"
    (object%js
      (* TODO: support stdin from javascript for repl, possibly converting asli repl to lwt *)
      method init (out : string -> unit) (err : string -> unit) = init (fun () -> "") out err
      method formatException (exn : exn) = Printexc.to_string exn ^ " " ^  Printexc.get_backtrace ()
      method printException (exn : exn) =  output_string stderr (Printexc.to_string exn) ; Printexc.print_backtrace stderr

      method marshal = Lib.marshal (env ())
      method unmarshal (x : Lib.js_uint8Array) = (cachedenv := Some (Lib.unmarshal x))
      method reset = (cachedenv := None)

      method dis (x: string) = dis x
      method setDebugLevel i = (LibASL.Dis.debug_level := i)
      method setPrettyPrint (x : bool) = (print_pp := x)
      method setFlags (flags: Js.js_string Js.t Js.js_array Js.t) =
        Array.iter (fun x -> LibASL.Flags.set_flag @@ Js.to_string x) (Js.to_array flags)
     end) in
  ()
